import os

FILES = [
    "C:\\Users\\decap\\puxarota\\routes.js",
    "C:\\Users\\decap\\puxarota\\index.html",
    "C:\\Users\\decap\\puxarota\\routes.css"
]

REPLACEMENTS = {
    "prÃ©": "pré",
    "USDT Ã©": "USDT é",
    "prÃ©-pago": "pré-pago",
    "estÃ value": "estável",
    "crypto est": "cristal",
    "CartÃo": "Cartão",
    "conheÃ§a": "conheça",
    "avanÃ§ar": "avançar",
    "AÃ§O": "AÇÕ",
    "conta": "conta",
    "dinheiro": "dinheiro",
    "USDT": "USDT"
}

def fix_file(filepath):
    print(f"Corrigindo: {filepath}")
    try:
        with open(filepath, "rb") as f:
            data = f.read()
        
        # Try to decode
        text = None
        for enc in ["utf-8-sig", "utf-8", "latin-1"]:
            try:
                text = data.decode(enc)
                print(f"  Decodificado com {enc}")
                break
            except:
                continue
        
        if text is None:
            print("  Falha na decodificação")
            return
        
        # Apply replacements
        for old, new in REPLACEMENTS.items():
            text = text.replace(old, new)
        
        # Save
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(text)
        print("  OK")
    except Exception as e:
        print(f"  Erro: {e}")

for f in FILES:
    if os.path.exists(f):
        fix_file(f)

print("Concluído!")