# União Gestão Financeira — projeto local completo

Código-fonte real da versão 1 do Site União • Gestão Financeira, publicada a partir do commit `f97698246a7ab755a0497483693d6628f3c97d6b`.

As telas, estilos, componentes, regras de negócio, API e esquema do banco foram copiados integralmente. Este projeto não foi recriado a partir de uma imagem. As adaptações são de execução local, identidade de desenvolvimento, scripts e documentação.

## Abrir no VS Code

1. Extraia o ZIP para uma pasta, por exemplo `C:\Projetos\uniao-gestao-financeira-local`.
2. No VS Code, escolha **Arquivo → Abrir Pasta** e selecione a pasta que contém `package.json`. Também pode abrir `uniao-financeiro.code-workspace`.
3. Instale o Node.js **22.13 ou superior** (recomendado: Node.js 22 LTS atualizado). A instalação inicial precisa de internet.
4. Abra **Terminal → Novo Terminal** e execute:

```sh
npm install
npm run dev
```

5. Acesse **http://localhost:5173**. Se aparecer **Entrar com ChatGPT**, clique para iniciar a sessão local de desenvolvimento. Nesse modo não é necessário entrar no ChatGPT nem contratar hospedagem.

O `npm run dev` prepara o banco local automaticamente, aplicando somente as migrações pendentes. Depois inicia a aplicação. Para encerrar, pressione **Ctrl+C**.

Se o PowerShell bloquear `npm.ps1`, selecione o terminal **Command Prompt** no VS Code ou use `npm.cmd install` e `npm.cmd run dev`. Não é necessário mudar a política de execução do Windows.

### Instalação com versões travadas

O projeto também inclui o `pnpm-lock.yaml` original. Para reproduzir estritamente as dependências, use o pnpm 11.25.0 indicado em `package.json`:

```sh
corepack pnpm install --frozen-lockfile
npm run dev
```

Use apenas um gerenciador por instalação. A opção `npm install` é mais simples e resolve as dependências conforme `package.json`; a opção pnpm usa o lockfile original.

## Banco local e dados

- Mantém o esquema relacional D1/SQLite original.
- Wrangler emula o banco D1 localmente, sem conta Cloudflare, chave ou banco remoto.
- Os dados ficam na pasta **`.wrangler/state`** e permanecem após fechar o VS Code, reiniciar o servidor ou trocar o mês consultado.
- O banco começa vazio. Os lançamentos do Site publicado **não estão incluídos**; este pacote é a exportação do código, não uma exportação do banco de produção.
- Para backup completo local, pare o servidor e copie `.wrangler/state`. Para exportar registros autorizados, use a opção de exportação em Configurações. O JSON de registros não substitui sozinho um backup completo de todos os metadados do banco.
- Não apague `.wrangler/state` se quiser manter o histórico.

## Identidade local e permissões

O projeto preserva a autorização por perfil e loja da aplicação. O servidor de desenvolvimento usa uma identidade local simulada, limitada a conexões de loopback/localhost. O primeiro acesso ao banco vazio cria o administrador `admin@uniao.local`.

Para personalizar o nome ou testar outra pessoa, copie `.env.example` para `.env`, altere `LOCAL_USER_EMAIL` e `LOCAL_USER_NAME`, reinicie o servidor e entre novamente. Antes de testar outra pessoa, cadastre o e-mail correspondente e suas permissões em **Configurações** usando o administrador.

Esse modo não é um login com senha nem uma autenticação adequada para disponibilizar o sistema na rede da empresa ou na internet. Ele permite executar e desenvolver o projeto no seu computador. Para hospedagem independente com múltiplos usuários, será necessário configurar autenticação real no provedor escolhido e o banco persistente desse ambiente. A autenticação original do Site depende dos cabeçalhos da plataforma; copiá-la sem a plataforma não fornece um login de produção.

## Funcionalidades preservadas

- Painel gerencial, filtros por loja e período, projeções de 7, 15 e 30 dias.
- Contas a pagar e receber, baixas parciais, saldo em aberto e atrasos por faixa.
- Rotina da tesouraria, almoço, interrupções e índices de paradas.
- Cofres, diferenças de caixa, ranking, pendências e histórico.
- Conciliação, saldos informados e movimentações.
- Médias e gráficos de desempenho, sem considerar ausências como zero.
- Rascunhos no banco, relatórios com dados preservados, revisão e impressão/PDF pelo navegador.
- Perfis e lojas autorizadas, trilha de alterações e exportação de registros.

As limitações que já existiam na versão publicada também são preservadas: não há integração automática com ERP/bancos, anexos, assinatura gov.br ou estorno de baixas. Consulte `docs/ESCOPO-DA-VERSAO-ORIGINAL.md`.

## Comandos

| Comando | Finalidade |
|---|---|
| `npm run dev` | Prepara o banco e inicia em localhost:5173 |
| `npm run setup:local` | Aplica somente migrações locais pendentes |
| `npm run check` | Verifica os tipos TypeScript |
| `npm run build` | Compila o projeto para o runtime Cloudflare Worker |
| `npm run db:generate` | Gera novas migrações a partir de `db/schema.ts` |

`build` não publica o projeto e não o transforma em um HTML estático. A aplicação possui servidor e banco. O identificador do Site publicado foi removido desta cópia para evitar vinculação acidental. Não execute comandos remotos de banco se deseja trabalhar somente localmente.

## Organização do código

- `app/workspace.tsx`: interface e interações da aplicação.
- `app/globals.css`: estilos originais.
- `app/api/data/route.ts`: API e operações do banco.
- `app/chatgpt-auth.ts`: leitura da identidade original.
- `lib/model.ts`: validações e cálculos.
- `lib/forms.ts`: campos dos formulários.
- `lib/server.ts`: acesso ao banco e autorização.
- `db/schema.ts`: estrutura relacional.
- `drizzle/`: migrações originais.
- `components/ui/`: componentes reutilizáveis.
- `public/`: arquivos públicos, incluindo favicon.
- `scripts/local.mjs`: preparação e execução local multiplataforma.
- `wrangler.local.json`: configuração exclusivamente local do banco.
- `docs/PRESERVACAO.json`: hashes SHA-256 dos arquivos originais da aplicação.

A pasta `.openai` permanece somente com a declaração lógica do banco, usada pelo compilador original. Não contém credenciais nem vínculo com o Site publicado.
