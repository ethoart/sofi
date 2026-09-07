import struct
import xml.etree.ElementTree as ET

def encode_string_pool(strings, resource_ids=None):
    # strings: list of str
    # returns string_pool_bytes, string_offsets
    num_strings = len(strings)
    
    # We will use UTF-8 encoding
    flags = 1 << 8 # UTF-8 flag
    
    string_data = bytearray()
    offsets = []
    
    for s in strings:
        offsets.append(len(string_data))
        encoded = s.encode('utf-8')
        char_len = len(s)
        byte_len = len(encoded)
        
        # UTF-8 string encoding in string pool:
        # char count (1 or 2 bytes)
        if char_len > 127:
            string_data.append((char_len >> 8) | 0x80)
            string_data.append(char_len & 0xFF)
        else:
            string_data.append(char_len)
            
        # byte count (1 or 2 bytes)
        if byte_len > 127:
            string_data.append((byte_len >> 8) | 0x80)
            string_data.append(byte_len & 0xFF)
        else:
            string_data.append(byte_len)
            
        string_data.extend(encoded)
        string_data.append(0) # null terminator
        
    # Pad string data to 4-byte boundary
    while len(string_data) % 4 != 0:
        string_data.append(0)
        
    header_size = 28
    offsets_size = num_strings * 4
    strings_start = header_size + offsets_size
    styles_start = 0
    
    chunk_size = strings_start + len(string_data)
    
    header = struct.pack('<HHIIIII',
        0x0001, # type StringPool
        header_size,
        chunk_size,
        num_strings,
        0, # style count
        flags,
        strings_start,
        styles_start
    )
    
    offsets_bytes = b''.join(struct.pack('<I', off) for off in offsets)
    
    return header + offsets_bytes + bytes(string_data)

print("Testing string pool encoder...")
pool = encode_string_pool(["http://schemas.android.com/apk/res/android", "manifest", "package", "com.sofi.ai.assistant"])
print("Pool size:", len(pool))
