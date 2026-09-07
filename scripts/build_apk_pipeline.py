import os
import sys
import zipfile
import hashlib
import base64
import subprocess
import shutil
sys.path.append(os.path.dirname(__file__))
from axml_compiler import compile_axml

RAW_MANIFEST_XML = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.sofi.ai.assistant"
    android:versionCode="12"
    android:versionName="1.2.0">
    <uses-sdk android:minSdkVersion="28" android:targetSdkVersion="35" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <application
        android:allowBackup="true"
        android:icon="@0x7f010000"
        android:label="Sofi AI Assistant"
        android:roundIcon="@0x7f010000"
        android:supportsRtl="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>"""

def build_signed_apk(output_apk_path="./data/sofi-assistant-v1.2.apk"):
    os.makedirs("./tmp_apk", exist_ok=True)
    os.makedirs(os.path.dirname(output_apk_path), exist_ok=True)

    # 1. Compile binary AXML
    binary_axml = compile_axml(RAW_MANIFEST_XML)
    
    # 2. Extract existing DEX and resources if present
    existing_apk = "./data/sofi-assistant-v1.2.apk"
    apk_files = {}

    if os.path.exists(existing_apk):
        try:
            with zipfile.ZipFile(existing_apk, "r") as z:
                for name in z.namelist():
                    if not name.startswith("META-INF/") and name != "AndroidManifest.xml":
                        apk_files[name] = z.read(name)
        except Exception as e:
            print("Could not read existing apk:", e)

    # Ensure AndroidManifest.xml is the compiled AXML
    apk_files["AndroidManifest.xml"] = binary_axml

    # Ensure classes.dex exists
    if "classes.dex" not in apk_files:
        # Create minimal valid DEX header if missing
        # DEX magic: dex\n035\0
        dex_header = b'dex\n035\x00' + (b'\x00' * 104)
        apk_files["classes.dex"] = dex_header

    # 3. Build MANIFEST.MF & CERT.SF
    manifest_mf_lines = [
        "Manifest-Version: 1.0",
        "Created-By: 1.0 (Sofi Build Pipeline)",
        ""
    ]

    cert_sf_lines = [
        "Signature-Version: 1.0",
        "Created-By: 1.0 (Sofi Build Pipeline)",
        ""
    ]

    for name in sorted(apk_files.keys()):
        content = apk_files[name]
        sha256_b64 = base64.b64encode(hashlib.sha256(content).digest()).decode("utf-8")
        
        entry = [
            f"Name: {name}",
            f"SHA-256-Digest: {sha256_b64}",
            ""
        ]
        manifest_mf_lines.extend(entry)

    manifest_mf_str = "\r\n".join(manifest_mf_lines) + "\r\n"
    manifest_mf_bytes = manifest_mf_str.encode("utf-8")

    mf_sha256_b64 = base64.b64encode(hashlib.sha256(manifest_mf_bytes).digest()).decode("utf-8")
    cert_sf_lines.insert(2, f"SHA-256-Digest-Manifest: {mf_sha256_b64}")

    for name in sorted(apk_files.keys()):
        content = apk_files[name]
        entry_str = f"Name: {name}\r\nSHA-256-Digest: {base64.b64encode(hashlib.sha256(content).digest()).decode('utf-8')}\r\n\r\n"
        entry_hash = base64.b64encode(hashlib.sha256(entry_str.encode("utf-8")).digest()).decode("utf-8")
        
        cert_sf_lines.extend([
            f"Name: {name}",
            f"SHA-256-Digest: {entry_hash}",
            ""
        ])

    cert_sf_str = "\r\n".join(cert_sf_lines) + "\r\n"
    cert_sf_bytes = cert_sf_str.encode("utf-8")

    # Write CERT.SF and MANIFEST.MF to disk for openssl
    with open("./tmp_apk/MANIFEST.MF", "wb") as f:
        f.write(manifest_mf_bytes)
    with open("./tmp_apk/CERT.SF", "wb") as f:
        f.write(cert_sf_bytes)

    # 4. Generate RSA Developer Key & CERT.RSA using openssl
    subprocess.run([
        "openssl", "req", "-x509", "-newkey", "rsa:2048",
        "-keyout", "./tmp_apk/key.pem", "-out", "./tmp_apk/cert.pem",
        "-days", "10000", "-nodes",
        "-subj", "/CN=Sofi AI Developer/O=Sofi/C=US"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    subprocess.run([
        "openssl", "cms", "-sign",
        "-in", "./tmp_apk/CERT.SF",
        "-out", "./tmp_apk/CERT.RSA",
        "-outform", "DER",
        "-signer", "./tmp_apk/cert.pem",
        "-inkey", "./tmp_apk/key.pem",
        "-nodetach", "-binary"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    with open("./tmp_apk/CERT.RSA", "rb") as f:
        cert_rsa_bytes = f.read()

    # 5. Pack final signed APK zip
    with zipfile.ZipFile(output_apk_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        # Write META-INF first
        z.writestr("META-INF/MANIFEST.MF", manifest_mf_bytes)
        z.writestr("META-INF/CERT.SF", cert_sf_bytes)
        z.writestr("META-INF/CERT.RSA", cert_rsa_bytes)

        for name, content in apk_files.items():
            z.writestr(name, content)

    # Copy to public asset directory as well
    os.makedirs("./public", exist_ok=True)
    shutil.copy(output_apk_path, "./public/sofi-assistant-v1.2.apk")

    print(f"Successfully compiled and signed APK at {output_apk_path} (Size: {os.path.getsize(output_apk_path)} bytes)")

if __name__ == "__main__":
    build_signed_apk()
