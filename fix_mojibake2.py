import os

def fix_double_encoded(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()
    
    # The file is double-encoded UTF-8.
    # Current bytes: Cart\xc3\xa3o -> Cartão (this is correct UTF-8)
    # But the test sees 'prÃ©-pago' which means:
    # Original: pr é - pago (UTF-8 bytes: pr\xc3\xa9-pago)
    # Misinterpreted as latin-1: prÃ©-pago
    # Then encoded as UTF-8: pr\xc3\x83\xc2\xa9-pago
    
    # So we need to reverse the double encoding.
    # We need to decode as latin-1 first, then encode as latin-1, then decode as UTF-8.
    
    try:
        # Decode as latin-1 to get the misinterpreted characters as a string
        text = data.decode('latin-1')
        # Encode as latin-1 to get the original bytes
        original_bytes = text.encode('latin-1')
        # Decode as UTF-8 to get the correct text
        fixed_text = original_bytes.decode('utf-8')
        
        # Check if it fixed the problem
        if 'Cartão' in fixed_text and 'pré-pago' in fixed_text:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_text)
            print(f"Fixed {filepath}")
            return True
        else:
            print(f"Fix did not work for {filepath}")
            return False
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

if __name__ == '__main__':
    files = [
        'C:\\Users\\decap\\puxarota\\routes.js',
        'C:\\Users\\decap\\puxarota\\index.html',
        'C:\\Users\\decap\\puxarota\\routes.css',
    ]
    for f in files:
        if os.path.exists(f):
            fix_double_encoded(f)