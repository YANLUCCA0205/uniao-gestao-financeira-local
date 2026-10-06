# União — Gestão Financeira

Aplicação privada para lançamentos diários de tesouraria, contas a pagar e receber, conciliação e relatórios gerenciais. React/Vinext com API Cloudflare Worker, D1 e migrações Drizzle.

## Entregue nesta versão

- Visão geral por loja e período, compromissos, baixas, pendências e projeção de 7 dias.
- Importação em lote de títulos exportados do ERP para contas a pagar e receber, com consolidação por loja, período, movimento e tipo de transação.
- Consulta opcional e paginada dos títulos importados, sem recadastro individual como rotina.
- Rotinas com data de execução e do movimento, início/fim, pausas tipadas e volume.
- Médias por dias válidos, evolução semanal, quantidade, duração e índice de interrupções.
- Cofres com diferença acumulada, valor explicado, regularização e justificativa.
- Diferenças de caixa e pendências com responsável, prazo e próxima ação.
- Contas, saldos informados, conciliação até uma data e frequência por conta.
- Movimentações com transferências internas identificadas.
- Resumos gerenciais com previsto, realizado, vencidos, aberto, evolução semanal/mensal, comparações, anotações e providências; impressão/PDF via navegador.
- Histórico das importações e dos fechamentos, com origem, data e usuário; arquivos substituídos são preservados como arquivados.
- Rascunhos pessoais no banco, histórico de alterações e controle otimista de versão.
- Cadastro de acesso por e-mail/perfil/loja, exportação JSON dos registros autorizados.

## Acesso

O site inicia privado. A identidade é fornecida pela plataforma. O primeiro visitante autenticado inicializa o administrador, portanto abrir como proprietário antes de liberar o site à equipe. O cadastro interno não envia convites nem altera a audiência do site. Cada pessoa precisa do acesso da plataforma e de sua permissão interna. Não há login por senha próprio nesta versão.

## Regras confirmadas

Almoço e interrupções são descontados. Índice de paradas = minutos de interrupção / minutos decorridos da etapa sem almoço. Folgas, ausências e etapas incompletas ficam fora da média. Os tempos de uma mesma pessoa, etapa e dia são somados antes da média. O cofre é um saldo acumulado por conferência; os saldos diários não são somados. Todas as modalidades de recebíveis são aceitas.

## Limites e decisões pendentes

- Início com dados vazios; os documentos antigos não foram importados automaticamente.
- A primeira versão aceita arquivos CSV/TXT/TSV exportados do ERP. Formatos XLSX, integração direta e adaptações ao layout específico do ERP dependem de amostras e mapeamento.
- Saldos bancários são informados manualmente; importação de extratos e conciliação automática não estão incluídas.
- Projeção usa últimos saldos informados e títulos a vencer; precisa de saldos atualizados e completos. Não equivale a lucro.
- Relatórios preservam a posição conhecida na data do envio; uma seleção de período passado não reconstrói automaticamente todos os saldos históricos anteriores ao primeiro envio.
- Não inclui anexos nem assinatura digital gov.br; impressão/PDF usa o navegador.
- Reimporte o mesmo movimento, loja e período completo para corrigir um arquivo. Sobreposições parciais são recusadas para impedir perda de dias do arquivo anterior.
- Cadastros configuráveis de etapas/lojas e critérios/metas de prazo permanecem como próximas implementações.
- Datas de fechamento e prazo de entrega do financeiro ainda precisam ser definidos. Semana de desempenho: sábado a sexta.
- A liberação de acesso para equipe depende dos e-mails e lojas autorizadas.

## Verificação

`node node_modules/typescript/bin/tsc --noEmit`
`python tests/financial-invariants.py`
Gerar novas migrações com `node node_modules/drizzle-kit/bin.cjs generate`. Migrações publicadas são imutáveis.

Verificadas regras de tempo, pausas sobrepostas, ausência, valores monetários em centavos, diferença de cofre, migrações e operações de baixa parcial/excesso/saldo final. QA de navegador indisponível neste ambiente por ausência da habilidade control-browser; WebMCP é feature-detected e não foi validado em navegador compatível.
