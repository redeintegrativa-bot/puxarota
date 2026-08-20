from pathlib import Path
import sys

FILES = ("estudo.html", "estudo.css", "estudo.js", "supabase-auth.js")
SUSPICIOUS = ("\ufffd", "\u00c3", "\u00c2", "Cart?", "cart?", "Regi?", "regi?", "Benef?", "benef?", "Li??", "li??", "ve?culo", "n?o", "N?o", "est?", "sess?o", "gest?o", "permiss?o")
errors = []

for name in FILES:
    path = Path(name)
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        errors.append(f"{name}: UTF-8 invalido: {exc}")
        continue
    for marker in SUSPICIOUS:
        if marker in text:
            errors.append(f"{name}: texto suspeito {marker!r}")

html = Path("estudo.html").read_text(encoding="utf-8")
if '<meta charset="utf-8">' not in html.lower():
    errors.append("estudo.html: meta charset ausente")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print("UTF-8 e textos do estudo validados")

