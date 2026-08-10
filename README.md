# PuxaRota — coletor de oportunidades

Painel e coletor determinístico de oportunidades públicas para veículos agregados.

## Executar

```bash
python collector.py
python -m unittest discover -s tests -v
python3 -m http.server 4173
```

Abra http://localhost:4173.

## Arquivos

- `index.html`, `styles.css`, `app.js`: painel em três arquivos.
- `job-sources.json`: fontes oficiais e feeds de descoberta.
- `collector.py`: coleta (com retry por fonte), normaliza, deduplica e expira anúncios.
- `jobs.json`: feed público consumido pelo painel.
- `.github/workflows/collect-jobs.yml`: execução a cada quatro horas.

O painel tem apenas dois menus: **Cargas** e **Salvas**. Guardar uma oportunidade
persiste apenas no aparelho (localStorage) e está fora do GitHub. A ação principal
do cartão abre a página oficial da oportunidade em nova aba; nenhum dado é enviado.

Páginas oficiais são verificadas a cada ciclo e representam cadastro aberto, não uma vaga nova. Anúncios encontrados em RSS expiram após 30 dias. Falhas temporárias preservam anúncios ainda válidos como `unverified`.

Nunca grave GPS, telefone, candidatura ou perfil pessoal em `jobs.json`. O GitHub contém somente oportunidades públicas.
