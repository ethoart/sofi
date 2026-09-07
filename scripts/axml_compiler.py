import struct
import xml.etree.ElementTree as ET

ANDROID_NS = "http://schemas.android.com/apk/res/android"

# Known Android Attribute Resource IDs (android.R.attr)
ATTR_RES_MAP = {
    "theme": 0x01010000,
    "label": 0x01010001,
    "icon": 0x01010002,
    "name": 0x01010003,
    "permission": 0x01010006,
    "enabled": 0x0101000e,
    "exported": 0x01010010,
    "launchMode": 0x0101001d,
    "minSdkVersion": 0x0101020c,
    "versionCode": 0x0101021b,
    "versionName": 0x0101021c,
    "targetSdkVersion": 0x01010270,
    "allowBackup": 0x01010280,
    "supportsRtl": 0x010103af,
    "roundIcon": 0x0101052c,
    "foregroundServiceType": 0x010105a2,
}

# Type constants for attribute values
TYPE_REFERENCE = 0x01
TYPE_STRING = 0x03
TYPE_INT_DEC = 0x10
TYPE_INT_HEX = 0x11
TYPE_INT_BOOLEAN = 0x12

class AxmlCompiler:
    def __init__(self, xml_string):
        self.root = ET.fromstring(xml_string)
        self.strings = []
        self.string_map = {}
        self.resource_ids = []

    def get_string_index(self, s):
        if s not in self.string_map:
            idx = len(self.strings)
            self.strings.append(s)
            self.string_map[s] = idx
            return idx
        return self.string_map[s]

    def collect_strings(self):
        # Mandatory namespace strings
        self.ns_prefix_idx = self.get_string_index("android")
        self.ns_uri_idx = self.get_string_index(ANDROID_NS)

        def walk(elem):
            self.get_string_index(elem.tag.split('}')[-1])
            for k, v in elem.attrib.items():
                if k.startswith('{'):
                    ns, attr_name = k[1:].split('}')
                else:
                    attr_name = k
                
                self.get_string_index(attr_name)
                # If attribute has a mapped res id, record it
                if attr_name in ATTR_RES_MAP and attr_name not in [s for s in self.strings[:len(self.resource_ids)]]:
                    pass
                
                # Check value type
                if not (v.isdigit() or v.lower() in ('true', 'false') or v.startswith('@')):
                    self.get_string_index(v)

            for child in elem:
                walk(child)

        walk(self.root)

    def compile(self):
        self.collect_strings()

        # Build Resource Map for attributes in string pool
        resource_map_bytes = bytearray()
        res_ids = []
        for s in self.strings:
            if s in ATTR_RES_MAP:
                res_ids.append(ATTR_RES_MAP[s])
            else:
                res_ids.append(0)
        
        res_map_chunk = struct.pack('<HHII', 0x0180, 0x0008, 8 + len(res_ids) * 4, len(res_ids))
        res_map_chunk += b''.join(struct.pack('<I', rid) for rid in res_ids)

        # Build String Pool Chunk (0x0001)
        num_strings = len(self.strings)
        flags = 1 << 8  # UTF-8
        
        string_data = bytearray()
        offsets = []
        
        for s in self.strings:
            offsets.append(len(string_data))
            encoded = s.encode('utf-8')
            char_len = len(s)
            byte_len = len(encoded)
            
            if char_len > 127:
                string_data.append((char_len >> 8) | 0x80)
                string_data.append(char_len & 0xFF)
            else:
                string_data.append(char_len)
                
            if byte_len > 127:
                string_data.append((byte_len >> 8) | 0x80)
                string_data.append(byte_len & 0xFF)
            else:
                string_data.append(byte_len)
                
            string_data.extend(encoded)
            string_data.append(0)
            
        while len(string_data) % 4 != 0:
            string_data.append(0)
            
        header_size = 28
        offsets_size = num_strings * 4
        strings_start = header_size + offsets_size
        styles_start = 0
        chunk_size = strings_start + len(string_data)
        
        string_pool_chunk = struct.pack('<HHIIIIII',
            0x0001, header_size, chunk_size, num_strings, 0, flags, strings_start, styles_start
        )
        string_pool_chunk += b''.join(struct.pack('<I', off) for off in offsets)
        string_pool_chunk += bytes(string_data)

        # Build XML tree chunks
        xml_chunks = bytearray()

        # Start Namespace
        start_ns = struct.pack('<HHIIII', 0x0100, 0x0010, 0x0018, 1, 0xFFFFFFFF, self.ns_prefix_idx)
        start_ns += struct.pack('<I', self.ns_uri_idx)
        xml_chunks.extend(start_ns)

        def compile_elem(elem, line_no=1):
            tag_name = elem.tag.split('}')[-1]
            tag_idx = self.get_string_index(tag_name)
            
            # Attributes
            attrs = []
            for k, v in elem.attrib.items():
                if k.startswith('{'):
                    ns_url, attr_name = k[1:].split('}')
                    ns_idx = self.ns_uri_idx if ns_url == ANDROID_NS else 0xFFFFFFFF
                else:
                    attr_name = k
                    ns_idx = 0xFFFFFFFF
                    
                attr_name_idx = self.get_string_index(attr_name)
                
                # Parse typed value
                if v.isdigit():
                    raw_val_idx = 0xFFFFFFFF
                    type_code = TYPE_INT_DEC
                    typed_data = int(v)
                elif v.lower() == 'true':
                    raw_val_idx = 0xFFFFFFFF
                    type_code = TYPE_INT_BOOLEAN
                    typed_data = 0xFFFFFFFF
                elif v.lower() == 'false':
                    raw_val_idx = 0xFFFFFFFF
                    type_code = TYPE_INT_BOOLEAN
                    typed_data = 0
                elif v.startswith('@'):
                    raw_val_idx = 0xFFFFFFFF
                    type_code = TYPE_REFERENCE
                    try:
                        typed_data = int(v[1:], 16) if v.startswith('@0x') else int(v[1:])
                    except ValueError:
                        typed_data = 0x7f010000
                else:
                    raw_val_idx = self.get_string_index(v)
                    type_code = TYPE_STRING
                    typed_data = raw_val_idx

                # 20 bytes per attribute struct
                # uint32 ns_idx, name_idx, raw_val_idx, type_data (8-bit type shifted << 24 | 0x08), data
                attrs.append(struct.pack('<IIIII',
                    ns_idx,
                    attr_name_idx,
                    raw_val_idx,
                    (type_code << 24) | 0x08,
                    typed_data
                ))

            attr_count = len(attrs)
            elem_header_size = 0x0010
            elem_chunk_size = 0x0024 + attr_count * 20

            start_elem = struct.pack('<HHIIII', 0x0102, elem_header_size, elem_chunk_size, line_no, 0xFFFFFFFF, 0xFFFFFFFF)
            start_elem += struct.pack('<IHHHHHH', tag_idx, 0x0014, 0x0014, attr_count, 0, 0, 0)
            start_elem += b''.join(attrs)
            xml_chunks.extend(start_elem)

            for child in elem:
                compile_elem(child, line_no + 1)

            end_elem = struct.pack('<HHIIII', 0x0103, elem_header_size, 0x0018, line_no, 0xFFFFFFFF, 0xFFFFFFFF)
            end_elem += struct.pack('<I', tag_idx)
            xml_chunks.extend(end_elem)

        compile_elem(self.root)

        # End Namespace
        end_ns = struct.pack('<HHIIII', 0x0101, 0x0010, 0x0018, 1, 0xFFFFFFFF, self.ns_prefix_idx)
        end_ns += struct.pack('<I', self.ns_uri_idx)
        xml_chunks.extend(end_ns)

        # Total AXML file chunk
        total_size = 8 + len(string_pool_chunk) + len(res_map_chunk) + len(xml_chunks)
        axml_header = struct.pack('<HHI', 0x0003, 0x0008, total_size)

        return axml_header + string_pool_chunk + res_map_chunk + xml_chunks

def compile_axml(xml_str):
    compiler = AxmlCompiler(xml_str)
    return compiler.compile()

if __name__ == "__main__":
    with open("./data/sofi-assistant-v1.2.apk", "rb") as f:
        pass
    print("AXML Compiler module loaded successfully.")
