# Personagens e Imagens — PuxaRota

> Documento operacional: como os personagens/imagens foram criados e como refazer ou
> continuar. Manter atualizado sempre que um novo asset entrar.

## Personagens (3 fixos)

| Personagem | Papel | Imagens |
|---|---|---|
| **Rupi** | Mascote principal; acompanha lições do motorista | `rupi-next.png`, `rupi-hint.png`, `rupi-badge.png`, `rupi-mascot.png`, `rupi-pause.png`, `rupi-teach.png`, `rupi-wave.png`, `rupi-sleep.png` |
| **Faro** | Companheiro guarda (personagem Fiel; hoje aparece em lições temáticas) | `faro.png` |
| **Carcará** | Guarda/vigia (Segurança, Empresa-vaga, Voz) | `carcara-flight.png`, `carcara-scout.png` |

Escopo: são 3 personagens fixos. **Não criar novos** sem aprovação explícita.

## Como as imagens foram feitas

1. **Geração**: imagem gerada por IA em **PNG RGB quadrado** (ex.: `rupi-next-source.png`,
   1254×1254 RGB). Prompt seguia estilo de skill de geração de imagem (ver
   `~/.config/opencode/skills/image-gen/SKILL.md`).
2. **Fundo removido**: a versão otimizada vira **RGBA com transparência** — o alfa
   recorta o personagem (ex.: `rupi-next.png` com bbox `(87,100,1182,1137)`, ~29%
   opaco). O `*-source.png` é o original quadrado; o `*.png` sem sufixo é o recortado.
3. **Otimização**: as versões otimizadas pesam ~0.8–1.1 MB (source ~1.4–1.6 MB).
   Sem `pngquant`/`optipng`/ImageMagick no workstation — otimização feita via Pillow
   ou similar.

## Geração de novos personagens (fluxo atual, sem custo)

Sem chave FAL/Replicate/Stability, usamos **Pollinations.ai** (gratuito, sem chave):

```powershell
$base = "cartoon mascot sticker of a friendly caramel-brown Brazilian street dog (vira-lata caramelo), floppy ears, warm amber eyes, small white chest patch, wearing a tiny orange trucker vest, thick clean outline, soft cel shading, centered, full body, high quality childrens app mascot"
$url = "https://image.pollinations.ai/prompt/<prompt-codificado>?width=1024&height=1024&seed=<fixo-por-pose>&nologo=true"
```

- **Consistência**: manter a MESMA descrição base e variar só a pose/emoção; usar
  `seed` fixo por pose.
- Saída vem em **JPG 768×768** (Pollinations não entrega transparência).
- **Recorte RGBA**: flood-fill a partir dos cantos (tolerância ~30) + GaussianBlur(1.2)
  na máscara → PNG com fundo transparente. Script: `opencode\temp\cut-fiel.py`
  (adaptável para qualquer personagem).

## Personagem temático nas lições

- `routes.js` `moodFor()` deriva o mood da lição (alert/happy/eager/think/far) e o
  `sceneMarkup()` aplica classe `mood-*` no personagem — mesma arte, clima mudando
  por lição.
- `mascotPose()` escolhe a pose conforme o tipo de lição (teach/warn/action/share/
  checkpoint), e `SCENE_MASCOTS` guarda as poses disponíveis por personagem.
- Padrão atual: Rupi 8 poses · Faro 1 pose · Carcará 2 poses.
- Poses novas do Fiel (`rupi-teach.png`, `rupi-wave.png`, `rupi-sleep.png`): geradas no
  Pollinations com a mesma base do `rupi-next` e recortadas via flood-fill. Usadas em
  lições: teach → mood `think`, wave → lição de compartilhar, sleep → no meio de lições
  longas. Troca Faro→Fiel já aplicada nas rotas `beneficios-ripio` e
  `empresa-contratacao-responsavel` (`mascot: "rupi"`).

## Recuperar os originais (source)

Os `*-source.png` foram removidos do git na limpeza (`6eefdc2`) e ignorados via
`.gitignore` (`*-source.png`), mas **os blobs ainda existem no histórico**:

```bash
git checkout 1bd97bb -- rupi-next-source.png   # (e demais *-source.png)
```

## Workstation — ferramentas disponíveis

| Ferramenta | Status |
|---|---|
| Python + Pillow 12.3.0 | ✅ disponível |
| ffmpeg 8.1 | ✅ disponível |
| pngquant / optipng / ImageMagick | ❌ não instalados |
| Chave FAL / Replicate / Stability | ❌ nenhuma no cofre/env |
| Pollinations.ai (gratuito, sem chave) | ✅ disponível |
| OmniRoute (gateway local :20128) | ❌ não expõe modelo de imagem |
| OpenRouter | só modelos de imagem **pagos** (sem free) |
| Groq | só texto |

## Gerar novo personagem

Para criar um novo asset é necessário **uma** destas opções:

1. **Pollinations.ai** (gratuito) — mais rápido, padrão de geração atual.
2. **Chave paga de geração** (`FAL_KEY`, `REPLICATE_API_KEY` ou `STABILITY_API_KEY`)
   no cofre (`~/.config/opencode/state/credentials.env`) — mais qualidade: FLUX Schnell
   via FAL (~$0.003/imagem). Ver skill `image-gen`.
3. **Asset fornecido pelo usuário** (imagem já pronta, PNG com transparência).

Depois de gerar:
- salvar o quadrado como `*-source.png` (não versionar — já no `.gitignore`);
- remover o fundo e salvar como `*.png` recortado (RGBA);
- registrar o custo em `~/.config/opencode/knowledge/image-gen-costs.jsonl` (opcional);
- apontar o novo arquivo nos `SCENE_MASCOTS` de `routes.js`;
- atualizar este documento.

## Observações

- O cenário das lições é dinâmico (céu/hora + decoração temática por lição), definido
  em `SCENES`, `SCENE_LOOKS`, `SCENE_DECOS` e `SCENE_MASCOTS` no `routes.js`. O
  personagem aparece por rota; a decoração varia por lição (cartão, cripto, escudo,
  moedas, etc.).
- Pose "andando" usa `*-next.png`; "pensando" usa `*-hint.png`; "comemorando" usa
  `*-badge.png`; alerta/teach/eager/happy são poses temáticas do Fiel.
