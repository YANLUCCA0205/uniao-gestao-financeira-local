# Validação da cópia local

- 89 arquivos originais da aplicação comparados por SHA-256, sem diferenças.
- Verificação TypeScript aprovada.
- Build completo aprovado.
- Duas migrações aplicadas no banco local; segunda execução sem reaplicação.
- API rejeita usuário sem sessão com 401.
- Sessão local inicializa administrador.
- Gravação e leitura de lançamento aprovadas.
- Histórico de alterações recuperado.
- Página original renderizada pelo servidor com HTTP 200.

A validação foi executada em Linux, com Node.js 24 e as dependências da versão publicada. O Windows não foi executado neste ambiente; os comandos de instalação e scripts de execução local usam Node.js multiplataforma. Não foi realizada comparação visual por captura de tela. A preservação visual é sustentada pela identidade dos arquivos de interface e estilos, não por uma nova reconstrução.

Banco de teste, dependências instaladas, arquivos compilados e credenciais não estão no ZIP. O banco será criado vazio no primeiro uso.

O teste opcional `node tests/local-smoke.mjs` inicia o servidor, cria uma pendência de teste e consulta seu histórico. Rode-o somente em banco local de desenvolvimento, sem outra instância aberta.
