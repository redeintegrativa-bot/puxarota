import os

def fix_all_mojibake(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()
    
    # Try to decode as UTF-8 first
    try:
        text = data.decode('utf-8')
    except UnicodeDecodeError:
        text = data.decode('latin-1')
    
    # The mojibake we see is when UTF-8 bytes were decoded as latin-1 and then re-encoded as UTF-8.
    # So we need to reverse that: encode as latin-1, decode as UTF-8.
    try:
        fixed_bytes = text.encode('latin-1')
        fixed_text = fixed_bytes.decode('utf-8')
        
        # Check if this fixed the problem
        if 'Cartão' in fixed_text and 'pré-pago' in fixed_text and 'USDT é uma cripto estável' in fixed_text:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_text)
            print(f"Fixed {filepath}")
            return True
    except Exception:
        pass
    
    # If that didn't work, try the word-by-word replacement approach
    replacements = {
        'prÃ©': 'pré',
        'prÃ©-pago': 'pré-pago',
        'CartÃo': 'Cartão',
        'BenefÃ\u00ad': 'Benefícios',
        'conheÃ\u00a7a': 'conheça',
        'USDT Ã©': 'USDT é',
        'cripto estÃ\u00a9vel': 'cri estável',
        'estÃ\u00a9vel': 'estável',
        'dÃ\u00a9lar': 'dólar',
        'crÃ\u00a9dito': 'crédito',
        'LIÃ\u00a7O': 'LIÇÃO',
        'avanÃ\u00a7ar': 'avançar',
        'AÃ\u00a7O': 'ÇÃO',
        'conta': 'conta',
        'economia': 'economia',
        'dinheiro': 'dinheiro',
        'dinheiro digital': 'dinheiro digital',
        'USDT': 'USDT',
        'cashback': 'cashback',
        'parceiros': 'parceiros',
        'cartão': 'cartão',
        'pré-pago': 'pré-pago',
        'cartão pré-pago': 'cartão pré-pago',
    }
    
    new_text = text
    for broken, fixed in replacements.items():
        new_text = new_text.replace(broken, fixed)
    
    if new_text != text:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_text)
        print(f"Fixed {filepath} using word replacements")
        return True
    
    print(f"No changes made to {filepath}")
    return False

if __name__ == '__main__':
    files = [
        'C:\\Users\\decap\\puxarota\\routes.js',
        'C:\\Users\\decap\\puxarota\\index.html',
        'C:\\Users\\decap\\puxarota\\routes.css',
    ]
    for f in files:
        if os.path.exists(f):
            fix_all_mojibake(f)