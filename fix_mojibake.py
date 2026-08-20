import os

def fix_mojibake(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # The mojibake is actually double-encoded UTF-8.
    # A correct approach is to read the file as UTF-8 (which gives us the mojibake string),
    # then encode that string as latin-1 (to get the original bytes), and decode as UTF-8.
    
    # Let's try: encode as latin-1, decode as utf-8
    try:
        fixed_b = content.encode('latin-1')
        fixed_str = fixed_b.decode('utf-8')
        
        # Check if it fixed the main problem
        if 'Cartão pré-pago' in fixed_str:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_str)
            print(f"Fixed {filepath} using double-decode method")
            return True
    except Exception:
        pass
    
    return False

if __name__ == '__main__':
    files = [
        'C:\\Users\\decap\\puxarota\\routes.js',
        'C:\\Users\\decap\\puxarota\\index.html',
        'C:\\Users\\decap\\puxarota\\routes.css',
    ]
    for f in files:
        if os.path.exists(f):
            fix_mojibake(f)