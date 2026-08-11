# Arquitetura — VORTEX ERP

## Isto é o código-fonte completo, não um build

Não existe nenhuma etapa de compilação, bundle ou minificação neste
projeto — o que você vê é exatamente o que o navegador executa. Todo
arquivo `.js`/`.css` é texto legível, comentado, sem ofuscação. Isso foi
uma decisão deliberada desde a refatoração original (ver `docs/HISTORICO-REFATORACAO.md`):
o app usa `<script src>`/`<link>` clássicos, carregados na ordem exata em
que aparecem no `index.html` — sem `import`/`export`, sem Webpack/Vite/
Rollup, sem `node_modules` em produção.

**Para desenvolver:** edite qualquer arquivo `.js`/`.css` normalmente e dê
refresh no navegador. Não há "rebuild".

## Por que não existem pastas `pages/` ou `layouts/`

Este é um SPA (single-page app) onde todas as telas (`<div class="page"
id="page-obras">`, `id="page-financeiro">` etc.) e a estrutura de shell
(sidebar, topbar) já estão todas dentro do único `index.html`, alternadas
via JavaScript (troca de classes `.active`). Não existe um sistema de
templates/fragmentos HTML carregados dinamicamente — criar arquivos
`pages/obras.html` separados exigiria adicionar um mecanismo de
carregamento assíncrono de HTML que não existe hoje, e isso mudaria como o
app funciona (não é só reorganizar arquivo, é adicionar comportamento
novo). Por isso essas pastas não foram criadas artificialmente.

## Mapa da estrutura

```
index.html          → HTML único: shell da aplicação + todas as telas (divs .page)
styles/              → CSS, carregado nesta ordem no <head>:
  reset.css            reset universal
  variables.css         variáveis de tema (:root)
  global.css            utilitários (.flex, .mb-*, .text-*...)
  layout.css            sidebar, topbar, breadcrumb
  components.css        botões, cards, modal, form, tabs, toast...
  dashboard.css          stat cards
  modules.css            login, diário, lightbox, gantt
  responsive.css         media queries + dark mode (tema padrão) + print

core/                → boot da aplicação, roteamento entre páginas
config/              → dados iniciais/seed e textos configuráveis do login
database/            → camada de acesso a dados (DB.get/add/update/delete)
                        e StorageService (localStorage)
utils/               → validação, formatação (moeda/data), helpers gerais
components/          → sidebar, modal, toast, busca universal, alertas
services/            → autenticação, sessão, Supabase, sincronização, log de atividades
modules/              → uma pasta por módulo de negócio:
  dashboard/, obras/, financeiro/, compras/, estoque/, funcionarios/,
  rh/, fornecedores/, clientes/, documentos/, contratos/, cronograma/,
  diario-obras/, relatorios/, configuracoes/

assets/              → imagens/ícones/fontes ESTÁTICOS (hoje vazio — o
                        app usa imagens embutidas em base64 e Google Fonts
                        via CDN; ver README.md)
sql/                 → schema.sql: schema de referência para Supabase/
                        Postgres, reconstruído a partir dos campos que o
                        código realmente usa (não existe no app em si —
                        é documentação para quando for configurar o
                        backend de verdade)
docs/                → esta documentação + o histórico da refatoração
.vscode/             → configuração recomendada do VS Code (extensões, Live Server)
```

## Ordem de carregamento importa

O app não usa módulos ES (`import`/`export`) — é tudo escopo global
clássico. Isso significa que **a ordem dos `<script src>` no
`index.html` não é arbitrária**: vários arquivos dependem de
funções/variáveis definidas em arquivos carregados antes deles (por
exemplo, os arquivos `gc-*.js` da Gestão Contratual dependem de
`modules/contratos/contratos.js` e `modules/contratos/aditivos.js`
terem carregado primeiro). Se for adicionar um novo arquivo `.js`:

1. Crie o arquivo dentro da pasta do módulo correspondente.
2. Adicione `<script src="modules/seu-modulo/seu-arquivo.js"></script>`
   no `index.html`, **depois** de qualquer arquivo do qual ele dependa.
3. Se for só uma função nova sem dependências de outros módulos, a
   posição não importa muito — mas prefira colocar perto de arquivos
   relacionados, por legibilidade.

## Como rodar localmente

Como o `index.html` usa caminhos relativos (`<script src="core/app.js">`),
alguns navegadores bloqueiam isso ao abrir o arquivo direto via
`file://` (erro de CORS). Use um servidor local:

```bash
python3 -m http.server 8000
# ou, com Node instalado:
npx serve .
```

Ou instale a extensão **Live Server** no VS Code (já sugerida em
`.vscode/extensions.json`) e clique em "Go Live".

## Supabase (nuvem/multi-tenant)

O app já está preparado para sincronizar com o Supabase
(`services/supabase.js`, `services/sync.js`), mas os campos
`SUPABASE_URL`/`SUPABASE_ANON_KEY` estão como placeholder — nenhuma
credencial real está neste repositório. Para ativar:

1. Crie um projeto no Supabase.
2. Rode `sql/schema.sql` no SQL Editor do Supabase (ajuste antes: são
   tabelas de referência, revise nomes/tipos para o seu caso).
3. Configure Row Level Security (RLS) por `empresa_id` em cada tabela
   — isso é o que garante isolamento entre empresas (multi-tenant), e
   **não pode ser configurado só no código do front-end**.
4. Preencha `SUPABASE_URL`/`SUPABASE_ANON_KEY` em `services/supabase.js`.

## Ponto de atenção antes de produção

Ver `README.md` (seção "Segurança") — o serviço de autenticação
(`services/auth.js`) guarda credenciais padrão em texto puro no
código-fonte. Resolver isso é uma mudança de lógica de negócio que não
foi feita automaticamente por instrução explícita durante a
refatoração; trate como pré-requisito antes de ir para produção com
dados reais.
