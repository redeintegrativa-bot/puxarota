# Handoff — próxima sessão do PuxaRota

Data: 2026-08-10

## Estado estável preservado

- Produção: https://puxarota.vercel.app
- GitHub: https://github.com/redeintegrativa-bot/puxarota
- Branch: main
- Coletor agendado a cada quatro horas.
- Feed público: jobs.json.
- Última suíte: 11 testes aprovados.
- Correção de modal/CSS sobreposto publicada.

## Pedido atual do usuário

Tudo que aparece como botão precisa executar uma função real. Se o recurso ainda não existe, não mostrar o botão. Também ampliar as oportunidades usando fontes públicas verificáveis.

## Auditoria funcional

### Manter

- Usar GPS: consulta pontual somente após toque.
- Atualizar local: nova consulta somente após toque.
- Informar cidade: entrada manual.
- Próxima oportunidade: avança o cartão.
- Ver anúncio na fonte: abre página pública real.

### Transformar em função real

- Guardar oportunidade: persistir em localStorage.
- Criar uma tela Salvas que liste, abra e remova itens armazenados no aparelho.

### Remover da versão atual

- Minha rota com conteúdo simulado.
- Alertas/créditos sem backend.
- Meu veículo com perfil fictício.
- Abrir conversa fictício.
- Enviar meu perfil/candidatura sem backend.
- Qualquer telefone ou match demonstrativo.

## Interface-alvo

Somente dois menus:

1. Cargas
2. Salvas

A ação principal do cartão deve ser “Abrir oportunidade oficial”. A ação não envia dados; abre a fonte em nova aba. Deve existir aviso de que valores, disponibilidade e condições precisam ser confirmados com a empresa.

Separar a interface em:

- index.html
- styles.css
- app.js

Não deixar CSS e JavaScript grandes embutidos no HTML. Manter ocultação nativa com atributo hidden.

## Novas fontes públicas pesquisadas

Adicionar após confirmar acesso pelo coletor:

1. Raça Transportes
   - https://racatransportes.com.br/seja-um-agregado/
   - Cadastro oficial de transportador autônomo com veículo próprio.
   - Região/base pública: Itapecerica da Serra/SP; empresa informa filiais em 16 estados.

2. SPX Express
   - https://spx.com.br/br/driver/seja-um-motorista-parceiro.html
   - Veículos: Fiorino, Van, HR, VUC, 3/4, Toco, Truck e Carreta.
   - Operações: coleta, transferência e entrega.
   - Requisitos públicos detalhados.

3. Transportes Bertolini — TBL
   - https://www.tbl.com.br/gente/seja-agregado
   - Cadastro oficial para agregado com veículo próprio.
   - Atuação declarada no Brasil.

4. Expresso GM
   - https://www.expressogmtransportes.com.br/
   - Página pública “Agregue seu veículo à nossa frota”.
   - Atuação declarada em todo o Brasil.

5. Único Group
   - https://unicogroup.com.br/seja-um-agregado/
   - Processo público de homologação.
   - Solicita veículo próprio, documentação e experiência.

6. FateLog
   - https://www.fatelog.com.br/seja-um-agregado/
   - Informa vagas para atuação em todo o Brasil.
   - Formulário público por tipo de veículo.

7. Comercial Esperança — enriquecer registro existente
   - https://comercialesperanca.com.br/transporte
   - Saídas diárias, pagamentos semanais.
   - Bases: Arujá, São José do Rio Preto, Presidente Prudente e Hortolândia.
   - Requisitos: CNH vigente, CNPJ de transporte, ANTT, placa vermelha, veículo em bom estado e Android.

8. HF LOG — manter sob observação
   - https://hflogtransportes.com.br/
   - A pesquisa pública encontra conteúdo, mas o GitHub Actions teve falha de DNS.
   - Não marcar como verificada até o coletor conseguir acessar de forma consistente.

## Segurança editorial

- Página de cadastro permanente não deve ser apresentada como vaga recém-publicada.
- Não copiar ganhos estimados sem validação independente.
- Não armazenar CPF, telefone, placa, GPS ou candidatura no GitHub.
- Links de terceiros agregadores devem ter confiança inferior a páginas oficiais.
- Exibir data da última verificação e estado ativo/não confirmado.
- Uma fonte com erro não deve derrubar o restante da coleta.

## Sequência da próxima sessão

1. Confirmar git status limpo e atualizar main por fast-forward.
2. Ampliar job-sources.json com as seis fontes oficiais.
3. Executar testes e coleta real.
4. Conferir quais fontes responderam e não publicar as que falharem.
5. Reconstruir frontend em três arquivos.
6. Implementar localStorage de salvas.
7. Remover todos os recursos simulados.
8. Adicionar testes de cada botão visível.
9. Publicar GitHub e Vercel.
10. Validar produção em 320, 360, 390 e 412 px.
