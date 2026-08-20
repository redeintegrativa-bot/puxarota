import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Define the replacements: (broken, fixed)
    replacements = [
        ('Cart�o', 'Cartão'),
        ('pr�-pago', 'prÃ©-pago'),  # We'll fix this in a second step
        ('Benef�cios', 'Benefícios'),
        ('conhe�a', 'conheça'),
        ('�', ''),  # Remove any remaining replacement characters? But we might lose other characters.
    ]
    
    # We'll do the replacements in a specific order to avoid double replacement.
    # First, handle the ones that are two-part: we want to replace the � in the middle of a word.
    # Actually, we can do each replacement individually.
    
    # Let's do a more systematic approach: replace the replacement character with the correct letter based on context.
    # But for simplicity, we'll do the known words.
    
    # We know that the replacement character � is standing in for a specific letter.
    # We can map the broken word to the fixed word.
    word_map = {
        'Cart�o': 'Cartão',
        'pr�-pago': 'prÃ©-pago',  # This is not correct, we need to see what the actual bytes are.
        'Benef�cios': 'Benefícios',
        'conhe�a': 'conheça',
    }
    
    # Instead, let's look at the actual broken string in the file and replace it with the fixed string.
    # We can read the file as binary and then try to decode it as 'latin-1' and then encode as 'utf-8' to fix double-encoded UTF-8.
    # This is a common fix for when a UTF-8 string was incorrectly treated as latin-1 and then saved as UTF-8.
    
    # Try to fix by interpreting the latin-1 bytes as UTF-8.
    try:
        # Read as binary
        with open(filepath, 'rb') as f:
            b = f.read()
        # Decode as latin-1 (which never fails) to get the original bytes as characters
        latin1_str = b.decode('latin-1')
        # Now encode as UTF-8 and then decode as UTF-8? Actually, we want to see if the latin1_str is the mojibake version.
        # If the original was UTF-8 and then incorrectly decoded as latin-1, then the latin1_str will have the mojibake.
        # Then we can try to encode that latin1_str as latin-1 to get the original bytes and then decode as UTF-8.
        fixed_b = latin1_str.encode('latin-1')
        fixed_str = fixed_b.decode('utf-8')
        # If this succeeds and changes the string, use it.
        if fixed_str != content:
            # Check if it fixed the problem
            if 'Cartão' in fixed_str and 'pré-pago' in fixed_str:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(fixed_str)
                print(f"Fixed {filepath} using latin-1 -> UTF-8")
                return
    except Exception as e:
        print(f"Error in latin-1 fix: {e}")
    
    # If that didn't work, try the direct replacement for known words.
    new_content = content
    for broken, fixed in word_map.items():
        new_content = new_content.replace(broken, fixed)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filepath} using word map")
    else:
        print(f"No changes made to {filepath}")

if __name__ == '__main__':
    fix_file('C:\\Users\\decap\\puxarota\\routes.js')
    fix_file('C:\\Users\\decap\\puxarota\\index.html')
    fix_file('C:\\Users\\decap\\puxarota\\routes.css')