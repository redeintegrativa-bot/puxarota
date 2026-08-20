import os

with open('C:\\Users\\decap\\puxarota\\routes.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Substituir todas as ocorrências de 'prÃé' por 'pré'
fixed_content = content.replace('pr\u00c3\u00e9', 'pr\u00e9')

# Escrever de volta
with open('C:\\Users\\decap\\puxarota\\routes.js', 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print('Fix concluído!')