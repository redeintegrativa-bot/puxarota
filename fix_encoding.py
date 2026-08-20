import os

def fix_encoding(filepath):
    # Read the file as binary
    with open(filepath, 'rb') as f:
        data = f.read()
    
    # Try to decode as utf-8-sig (to handle BOM)
    try:
        content = data.decode('utf-8-sig')
    except UnicodeDecodeError:
        # If that fails, try windows-1252 (common for Windows)
        try:
            content = data.decode('windows-1252')
        except UnicodeDecodeError:
            # If that fails, try latin-1 (ISO-8859-1)
            content = data.decode('latin-1')
    
    # Write back as UTF-8 without BOM
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed encoding for {filepath}")

# Fix the files that are causing test failures
fix_encoding('C:\\Users\\decap\\puxarota\\routes.js')
fix_encoding('C:\\Users\\decap\\puxarota\\index.html')
fix_encoding('C:\\Users\\decap\\puxarota\\routes.css')