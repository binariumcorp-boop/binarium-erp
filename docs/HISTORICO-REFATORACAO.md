# ERP — Projeto Refatorado (Fase 1 + 2)

Este projeto é o resultado da extração do arquivo único `DOC-20260805-WA0010.html`
(11.030 linhas, CSS e JS embutidos) para uma estrutura de arquivos organizada,
**sem nenhuma alteração de comportamento, lógica ou UI**.

## O que foi feito

### Fase 1 — CSS
O único bloco `<style>` do arquivo original (256 KB) foi dividido em 8 arquivos
temáticos dentro de `assets/css/`, carregados via `<link>` no `index.html` na
mesma ordem em que o conteúdo aparecia no arquivo original — nenhuma regra CSS
foi reordenada, removida ou reescrita.

- `reset.css` — reset universal
- `variables.css` — variáveis `:root` e import de fonte
- `global.css` — utilitários (`.mb-*`, `.flex`, `.text-*`, `.empty-state`, etc.)
- `layout.css` — app shell, sidebar, topbar, breadcrumb, section header
- `components.css` — botões, cards, badges, tabela, modal, form, tabs, alert,
  toast, confirm dialog, upload area, etc.
- `dashboard.css` — stat cards do dashboard
- `modules.css` — tela de login, diário de obra (fotos/registro ágil),
  lightbox, gantt/cronograma
- `responsive.css` — media queries, scrollbar e **dark mode** (que no arquivo
  original é o tema padrão do sistema — um segundo bloco `:root` sem
  media query, que sobrescreve as variáveis de cor)

**Validado:** todos os 273 seletores do arquivo original existem no conjunto
dividido, sem duplicatas e sem perdas (checado programaticamente).

### Fase 2 — JavaScript
Os dois blocos `<script>` originais (496 KB / 8.810 linhas ao todo) foram
divididos em **58 arquivos** dentro de `js/core/`, `js/services/`,
`js/components/` e `js/modules/<nome-do-modulo>/`.

Importante: o projeto **não usa bundler nem ES Modules** (`import`/`export`).
Os arquivos continuam sendo scripts clássicos carregados via `<script src>`,
exatamente como no original — apenas organizados em arquivos menores. Isso foi
uma decisão deliberada: converter para ES Modules exigiria reescrever todas as
referências entre funções (a maioria é acessada via `window.nomeDaFuncao` em
atributos `onclick=""` no HTML), o que é um risco real de quebrar
funcionalidades. A estrutura em módulos de pastas já entrega organização e
manutenibilidade sem esse risco.

**A ordem de carregamento dos `<script src>` no `index.html` é idêntica à
ordem do código no arquivo original.** Isso é essencial: várias partes do
código (ex: `FASE 3: GANCHOS DE ROTEAMENTO`, o objeto `CloudSync`, os módulos
de RH e Configurações) dependem de funções/variáveis definidas em blocos
anteriores. Reordenar os arquivos alfabeticamente ou por pasta quebraria o
sistema — por isso alguns módulos (ex: `configuracoes`, `obras`, `compras`,
`fornecedores`, `dashboard`, `rh`) têm mais de um arquivo `.js`, cada um
correspondendo a um trecho do código-fonte original na posição exata em que
aparecia.

O primeiro bloco `<script>` original começava com `'use strict';` — essa
diretiva foi replicada no topo de cada um dos 51 arquivos derivados dele, para
preservar o modo estrito exatamente como no original. O segundo bloco
original **não tinha** `'use strict'` (modo não-estrito) — os 7 arquivos
derivados dele (`obras/mapa.js`, `obras/obra-painel-completo.js`,
`contratos/aditivos.js`, `rh/rh.js`, `configuracoes/permissoes.js`,
`core/app-hooks-fase3.js`, `rh/rh-pagina-central.js`) foram mantidos sem a
diretiva, pelo mesmo motivo.

**Validado:**
- Todos os 58 arquivos passam em `node --check` (sintaxe válida).
- O conteúdo de todos os arquivos, concatenado na ordem de carregamento,
  é **idêntico caractere a caractere** ao dos dois `<script>` originais
  (ignorando espaços em branco e a diretiva `'use strict'`, que foi
  deliberadamente duplicada por arquivo pelo motivo acima).
- Todas as 422 declarações de função/const/let de nível superior do original
  existem no conjunto dividido, sem duplicatas e sem perdas.

### `index.html`
O `<head>`, o corpo (HTML/markup de todas as telas) e o fechamento do
documento são **exatamente os mesmos** do arquivo original — só os blocos
`<style>`/`<script>` inline foram substituídos por `<link>`/`<script src>`
apontando para os arquivos extraídos. As dependências externas (Google
Fonts, Leaflet, Supabase JS via CDN) foram mantidas como estavam.

## O que existe na pasta mas não tem conteúdo do original

- `assets/images/`, `assets/icons/`, `assets/fonts/` — o app original não
  referencia nenhum arquivo de imagem/ícone/fonte local: imagens são
  embutidas como `data:` URI (ex: fundo da tela de login) ou vêm de CDN
  (Google Fonts). As pastas foram criadas vazias, prontas para uso futuro.
- `js/services/upload.js` — não existe um serviço de upload centralizado no
  original; cada módulo (diário de obra, documentos, RH, configurações) tem
  sua própria função `handleXUpload`, mantida dentro do respectivo arquivo de
  módulo para não alterar a lógica.
- `js/components/navbar.js`, `header.js`, `footer.js`, `tables.js`,
  `charts.js`, `cards.js` — o app original não separa esses elementos em
  componentes de JS próprios (o HTML deles está fixo no `index.html`, e o
  estilo vem de `components.css`/`layout.css`). Não foram criados arquivos
  vazios "fake" para não sugerir uma funcionalidade que não existe — isso fica
  como sugestão de próximo passo de refatoração, não como parte desta fase.
- Pastas do enunciado sem equivalente funcional no app original:
  `equipamentos/`, `crm/`, `agenda/` — o código-fonte não tem nenhuma tela
  ou lógica para esses módulos hoje (apenas o campo de texto livre
  "equipamentos" dentro do diário de obra). Não foram criadas essas pastas
  para não sugerir funcionalidades inexistentes.
- Times de "equipe" (pessoas alocadas em obra) e o módulo de RH completo
  já existem e foram mapeados para `funcionarios/` e `rh/`, que é a divisão
  real usada no código.
- `clientes/` contém `assinatura.js` (tela "Minha Assinatura" / cobrança via
  Asaas) — não há um cadastro de clientes separado no original.

## Auditoria (pós Fase 1 + 2)
Uma auditoria completa foi feita antes de gerar o ZIP final, verificando:

- **Pastas criadas por engano:** o comando inicial de criação de diretórios
  usava expansão de chaves (`{core,modules/{...}}`) que não expandiu
  corretamente no shell usado, criando duas pastas literais com nomes como
  `js/{core,modules...}`. Essas pastas estavam vazias e foram removidas.
- **Referências quebradas:** todos os 8 `<link rel="stylesheet">` e todos os
  58 `<script src>` do `index.html` apontam para arquivos que realmente
  existem em disco (checado programaticamente, 0 problemas).
- **Arquivos órfãos:** todo arquivo `.css`/`.js` em disco está referenciado
  no `index.html`, e vice-versa — nenhum arquivo sobrando, nenhuma referência
  para arquivo inexistente.
- **Módulos duplicados:** nenhuma das 422 declarações de função/const/let de
  nível superior aparece em mais de um arquivo.
- **Caminhos incorretos:** os únicos `url()`/`src=` que apontam para fora dos
  arquivos do projeto são o CDN de fontes do Google (já existia no original)
  e imagens embutidas em `data:` URI (também já existiam no original) — nada
  quebrado.
- **Sintaxe:** todos os 58 arquivos `.js`, na ordem exata em que são
  carregados pelo `index.html`, passam em `node --check`.

## Auditoria (pós Fase 1 + 2)
Uma auditoria completa foi feita antes de gerar o ZIP final, verificando:

- **Pastas criadas por engano:** o comando inicial de criação de diretórios
  usava expansão de chaves (`{core,modules/{...}}`) que não expandiu
  corretamente no shell usado, criando duas pastas literais com nomes como
  `js/{core,modules...}`. Essas pastas estavam vazias e foram removidas.
- **Referências quebradas:** todos os 8 `<link rel="stylesheet">` e todos os
  58 `<script src>` do `index.html` apontam para arquivos que realmente
  existem em disco (checado programaticamente, 0 problemas).
- **Arquivos órfãos:** todo arquivo `.css`/`.js` em disco está referenciado
  no `index.html`, e vice-versa — nenhum arquivo sobrando, nenhuma referência
  para arquivo inexistente.
- **Módulos duplicados:** nenhuma das 422 declarações de função/const/let de
  nível superior aparece em mais de um arquivo.
- **Caminhos incorretos:** os únicos `url()`/`src=` que apontam para fora dos
  arquivos do projeto são o CDN de fontes do Google (já existia no original)
  e imagens embutidas em `data:` URI (também já existiam no original) — nada
  quebrado.
- **Sintaxe:** todos os 58 arquivos `.js`, na ordem exata em que são
  carregados pelo `index.html`, passam em `node --check`.

## Auditoria técnica completa (2ª rodada)

Esta rodada usou ferramentas reais (ESLint 8, `node --check`, parsing
estrutural de CSS) em vez de inspeção manual, e comparou cada resultado
contra o arquivo monolítico original para provar, e não apenas afirmar, que
nada mudou de comportamento.

**Método de prova:** rodei o ESLint (regras: `no-unused-vars`, `no-undef`,
`no-dupe-keys`, `no-dupe-args`, `no-unreachable`, `no-redeclare`,
`no-func-assign`, `no-cond-assign`, `no-fallthrough`) contra (a) os 58
arquivos concatenados na ordem real de carregamento do `index.html`, e (b)
os dois `<script>` originais concatenados. Resultado: **182 avisos em
ambos, com a mesma lista exata de identificadores/regras** (comparação
automática, não apenas contagem). Fiz o mesmo para seletores CSS duplicados:
**311 blocos de regra, 34 seletores duplicados em ambos** — os mesmos 34
(padrão de override de dark mode + telas de login, que já existia no
arquivo original).

**Conclusão:** a refatoração não introduziu nenhum problema novo de JS ou
CSS. Tudo que o ESLint aponta é uma característica pré-existente do código
original.

### 1. Estrutura do projeto
✅ Pastas corretas, sem pastas malformadas (a única encontrada foi corrigida
na rodada anterior). Sem arquivos órfãos, duplicados ou desnecessários — o
projeto não tem `node_modules`, configs de build ou arquivos de auditoria
temporários (removidos antes de empacotar).

### 2. Imports / referências
✅ Não há `import`/`require` (o projeto usa scripts clássicos, de propósito
— ver justificativa na seção "Fase 2" acima). Não há "dependência circular"
no sentido de módulos ES, porque não existem módulos ES; existe, sim,
**ordem de carregamento**, que é a substituta funcional disso — e ela foi
validada 100% idêntica à ordem do arquivo original (ver Fase 2). Todos os
caminhos relativos de `<link>`/`<script src>` resolvidos e conferidos.

### 3. JavaScript
- **Funções duplicadas:** 0 (422/422 declarações únicas).
- **Código morto / variáveis não usadas:** o ESLint aponta ~150 funções
  como "unused" — isso é esperado e **não é um bug**: a grande maioria é
  chamada via `onclick="..."` diretamente no HTML, o que um linter de JS
  puro não enxerga. Confirmei que a mesma lista aparece ao lintar o arquivo
  original. Não removi nada disso porque (a) removeria funcionalidade
  visível na UI, o que você pediu para não fazer, e (b) já é assim no
  original.
- **`renderFornecedores` não definida:** o código chama
  `typeof renderFornecedores === 'function'` (uma guarda defensiva) mas a
  função nunca foi definida em nenhum lugar — **isso já existia no arquivo
  original** (confirmado por grep). Como está protegido por `typeof`, não
  quebra nada em nenhuma das duas versões; é só uma checagem que nunca é
  verdadeira. Não foi alterado.
- **Eventos duplicados / vazamentos de memória:** nenhum padrão de
  `addEventListener` sem `removeEventListener` correspondente foi
  introduzido pela refatoração (o código usa majoritariamente `onclick=""`
  inline, não listeners dinâmicos acumulativos). Qualquer padrão desse tipo
  que exista é pré-existente no original.
- **Erros de inicialização:** os 58 arquivos, na ordem real de carregamento,
  passam em `node --check` sem erro de sintaxe, e a diretiva `'use strict'`
  foi replicada exatamente onde estava no original (só no bloco que
  originalmente a tinha).

### 4. CSS
- **Arquivos duplicados:** 0 — os 8 arquivos são fatias não sobrepostas do
  CSS original.
- **Classes repetidas / conflitos de estilo:** 34 seletores aparecem mais de
  uma vez (ex: `:root`, `.login-left`, `.badge-green`) — todos fazem parte
  do padrão intencional de "dark mode como tema padrão" do sistema original
  (um segundo bloco que sobrescreve variáveis e componentes). A ordem de
  carregamento dos 8 arquivos preserva exatamente a ordem de cascata
  original, então o resultado visual é idêntico.
- **CSS não utilizado:** não removido, pelo mesmo motivo do "código morto"
  em JS — não dá para garantir com segurança que uma classe não é
  referenciada dinamicamente (`classList.add`, template strings) sem rodar
  o app inteiro, e remover é um risco de mudar comportamento.
- **Ordem de carregamento:** validada — reset → variables → global → layout
  → components → dashboard → modules → responsive, replicando a ordem do
  arquivo original onde importa (ex: os overrides de dark mode em
  `responsive.css` carregam depois de tudo que eles sobrescrevem).

### 5. HTML
✅ Scripts e CSS carregados na ordem correta (verificado). Sem links
quebrados. Sem recursos inexistentes (as únicas referências externas são o
Google Fonts CDN, Leaflet CDN e Supabase JS CDN — todas já existiam no
original).

### 6. Componentes (sidebar, navbar/topbar, header, footer, modais, toasts,
tabelas, gráficos, cards)
O app original não separa navbar/header/footer como componentes de JS
próprios (o HTML deles é fixo dentro do `index.html`, dentro do corpo que
foi preservado byte a byte). Sidebar, modal, toast e confirm dialog têm
lógica JS própria e foram mapeados para `js/components/`. "Tabelas" e
"gráficos" no app original não são componentes reutilizáveis — cada tela
renderiza sua própria tabela via `innerHTML`/template strings; não existe
biblioteca de gráficos (não há Chart.js/D3 no projeto). Como o HTML/CSS/JS
de tudo isso é idêntico ao original, o comportamento visual e funcional é
o mesmo.

### 7. Módulos (confirmação de que nenhum perdeu funcionalidade)
Como o conteúdo de cada arquivo, concatenado na ordem de carregamento, é
comprovadamente idêntico caractere a caractere ao arquivo original (ver
Fase 2), **nenhum módulo perdeu código**. Mapeamento final:

| Módulo pedido | Onde está |
|---|---|
| Dashboard | `js/modules/dashboard/` (+ `dashboard-executivo.js`, `dashboard-sync.js`) |
| Obras | `js/modules/obras/` (obras, detalhe, serviços, mapa, painel completo) |
| Financeiro | `js/modules/financeiro/financeiro.js` |
| Compras | `js/modules/compras/` |
| Estoque | `js/modules/estoque/estoque.js` |
| RH | `js/modules/rh/` (RH completo + página central + ponto) |
| Funcionários | `js/modules/funcionarios/funcionarios.js` ("Equipe" no código original) |
| Fornecedores | `js/modules/fornecedores/` |
| Clientes | `js/modules/clientes/assinatura.js` (tela "Minha Assinatura") |
| Documentos | `js/modules/documentos/documentos.js` |
| Contratos | `js/modules/contratos/` (contratos + aditivos) |
| Cronograma | `js/modules/cronograma/cronograma.js` |
| Diário de Obras | `js/modules/diario-obras/` (diário + lightbox) |
| Relatórios | `js/modules/relatorios/relatorios.js` |
| Configurações | `js/modules/configuracoes/` (tema, cores, favicon, logo, white-label, backup, permissões, IA) |
| Controle de Ponto | dentro de `js/modules/rh/rh.js` (`baterPonto` e funções relacionadas — não é uma tela separada no original) |
| CRM / Agenda / Equipamentos | **não existem como módulos no código original** — não foram criadas pastas fictícias (ver nota na Fase 2) |
| SaaS | `js/services/supabase.js` + `js/services/sync.js` (infraestrutura multi-tenant) |

### 8. Serviços
| Serviço | Arquivo |
|---|---|
| Auth | `js/services/auth.js` + `js/services/auth-login-ui.js` |
| Supabase | `js/services/supabase.js` |
| Storage | `js/core/storage.js` + `js/core/database.js` |
| Sync | `js/services/sync.js` |
| Upload | não existe um serviço centralizado no original — cada módulo tem sua própria função `handleXUpload` (mantidas nos respectivos arquivos de módulo) |
| Permissões | `js/modules/configuracoes/permissoes.js` |
| Sessão | dentro de `js/services/auth.js` (`AuthService.SESSION_KEY`, `gob_session`) |

Todos presentes, sem alteração de lógica.

### 9. Performance
- **Código duplicado:** nenhum introduzido pela refatoração (confirmado via
  ESLint + contagem de declarações).
- **Arquivos grandes:** `assets/css/modules.css` (236 KB) e `index.html`
  (220 KB) são grandes porque contêm uma imagem de fundo da tela de login
  em base64 embutida — isso já existia no original; mover essa imagem para
  um arquivo `.jpg` separado em `assets/images/` reduziria bastante esses
  dois arquivos, mas é uma mudança de comportamento técnico (novo request
  HTTP) que não fiz sem sua autorização, já que você pediu para não alterar
  nada do comportamento.
- **Carregamento:** 58 arquivos `<script>` + 8 `<link>` = 66 requisições
  HTTP síncronas — mais requisições que o original (que tinha 2 + 2), mas
  isso é inerente a qualquer divisão em múltiplos arquivos sem bundler. Não
  há bundler/minificação neste projeto (decisão da Fase 2, para não mudar
  comportamento). Isso é uma troca consciente: mais legibilidade/organização
  em troca de mais requisições — normal em fase de refatoração antes de um
  passo de build.

### 10. Segurança
Itens visíveis no código (sem alterar nada, apenas reportando o que já
existia no original):
- `js/services/auth.js` guarda **usuário admin padrão e senha em texto
  puro** no próprio código-fonte (`senha: 'mbsolucoes2025'`), e também um
  Super Admin com senha fixa. Isso é uma característica do sistema
  original, não introduzida por mim — mas é um risco real de segurança em
  produção (qualquer pessoa com acesso ao código-fonte vê as senhas).
  Corrigir isso significa mudar a lógica de autenticação, o que você pediu
  explicitamente para eu não fazer nesta tarefa.
- `js/services/supabase.js` usa placeholders (`SEU_PROJECT_REF`,
  `SUA_ANON_KEY_AQUI`) — nenhuma credencial real está exposta no
  repositório. O isolamento entre empresas (multi-tenant) depende de
  políticas de Row Level Security configuradas **no painel do Supabase**,
  que não fazem parte deste repositório e não podem ser auditadas
  estaticamente por mim.
- Sessão é guardada em `localStorage` (`gob_session`) — comum em SPAs sem
  backend próprio, mas vulnerável a XSS se qualquer script de terceiros for
  injetado (não há CSP configurada no `index.html`, nem havia no original).

Nenhum desses pontos foi alterado, porque todos exigiriam mudança de lógica
de negócio/autenticação — fora do escopo que você definiu para esta tarefa.

### 11. Compatibilidade com VS Code
✅ Projeto abre normalmente no VS Code (é só HTML/CSS/JS estático, sem
build step). Recomendado usar a extensão **Live Server** (ou
`python3 -m http.server`) em vez de abrir o `index.html` direto via
`file://`, porque alguns navegadores bloqueiam `<script src>` local por
CORS quando o protocolo é `file://`.

### 12. Produção (GitHub / Vercel / Supabase / deploy)
- **GitHub:** pronto — é só dar `git init` e commitar; nenhum arquivo de
  build ou segredo real está no repositório.
- **Vercel:** pronto para deploy como site estático (sem configuração de
  build necessária — `index.html` na raiz).
- **Supabase:** o código já está preparado para se conectar (só falta
  preencher `SUPABASE_URL`/`SUPABASE_ANON_KEY` reais em
  `js/services/supabase.js` e configurar as tabelas/RLS no painel do
  Supabase — isso é trabalho de infraestrutura, fora do escopo de um
  refactor de arquivos).
- **Atenção antes de ir para produção de verdade:** o ponto de segurança
  #10 (senha em texto puro no código-fonte) deveria ser resolvido antes de
  publicar isso com dados reais de clientes.

## Notas de avaliação (0–100)

| Critério | Nota | Por quê |
|---|---|---|
| Arquitetura | 92 | Organização em módulos/camadas clara e sem dependências circulares; não chega a 100 porque ainda usa scripts clássicos em vez de um sistema de módulos real (decisão consciente para não mudar comportamento nesta fase). |
| Organização | 97 | Estrutura de pastas limpa, nomes claros, zero arquivo órfão/duplicado/malformado após a auditoria. |
| Performance | 78 | Sem código duplicado, mas 66 requisições HTTP sem bundler/minificação e uma imagem de 230 KB embutida em base64 dentro do CSS — ambos herdados do original e não resolvidos aqui de propósito. |
| Segurança | 55 | Ponto real e sério: credenciais de admin em texto puro no código-fonte (pré-existente). Isolamento multi-tenant depende de configuração externa (Supabase RLS) que não posso auditar por aqui. Não posso subir essa nota "corrigindo" isso sem alterar lógica de negócio, o que foi explicitamente vetado. |
| Escalabilidade | 85 | A separação por módulo/pasta facilita crescer o time e o código; falta um passo de build (bundler) para escalar em produção com muitos arquivos. |
| Manutenibilidade | 94 | Cada módulo é pequeno e localizável; README documenta a ordem de carregamento e as decisões tomadas. |
| Qualidade do código | 80 | O código em si (lógica, nomes, padrões) é o mesmo do original — não foi reescrito nem "limpo", por instrução explícita sua. A nota reflete o código herdado, não a refatoração. |
| Prontidão para produção | 65 | Estruturalmente pronto para deploy estático; **não deveria ir para produção com dados reais** enquanto a senha em texto puro (#10) não for resolvida — isso é uma decisão de negócio/segurança, não de arquitetura de arquivos. |

**Por que não elevei tudo para 95+ corrigindo automaticamente:** os itens
abaixo de 95 (Performance, Segurança, Qualidade do código, Prontidão para
produção) só melhorariam de verdade com mudanças que você pediu
explicitamente para eu **não** fazer nesta tarefa — alterar lógica de
autenticação, mudar como a imagem de login é servida, adicionar um
bundler/build step, ou reescrever/otimizar funções existentes. Fazer
qualquer uma dessas coisas "automaticamente e sem perguntar" seria
contrariar suas próprias instruções ("não altere layout", "não altere
regra de negócio", "não altere comportamento"). Se quiser, eu faço essas
melhorias como uma etapa separada e explícita (ex: "Fase 5 — Segurança" ou
"Fase 6 — Build/Bundler"), documentando cada mudança de comportamento antes
de aplicá-la.

## Módulo novo: Gestão Contratual

Adiciona os requisitos pedidos (Contrato Principal com campos/uploads,
Aditivos com 6 tipos e cálculo automático, Medições, Documentos, Linha do
Tempo, Histórico automático e Dashboard com KPIs/filtros/gráficos/drill-down)
sem alterar nenhum dos 58 arquivos originais nem nenhum arquivo CSS —
confirmado por hash (MD5 dos 8 CSS idêntico) e por contagem de scripts (58
originais + 10 novos, checado programaticamente).

**Arquitetura: um único módulo de Contratos.** Não existem dois cadastros de
contrato. A entidade `contratos` (já existente) foi só **estendida** com
campos novos (prefixo `gc*`: `gcTipoContrato`, `gcCliente`, `gcContratante`,
`gcResponsavel`, `gcDataAssinatura`, `gcObservacoes`, `gcAnexos`,
`gcValorOriginal`) — os contratos cadastrados antes desta mudança continuam
funcionando, só com esses campos vazios. A aba "Contratos" dentro do Painel
da Obra **filtra os mesmos registros** (`DB.get('contratos').filter(c =>
c.obraId === obra.id)`) e, ao abrir um contrato pela obra, abre exatamente a
mesma tela de detalhes do módulo principal (fecha o modal da obra e navega
até lá) — sem duplicar painel, sem duplicar dado.

**Como foi implementado sem tocar nos arquivos existentes:** todo o módulo
usa o mesmo padrão de "sobrescrever por cima" que o próprio sistema já usa
(ex: `aditivos.js` original sobrescreve `showContratoDetail`; `gc-06`
sobrescreve de novo, chamando a versão anterior primeiro). Nenhum arquivo
original foi editado — os 10 arquivos novos (prefixo `gc-`) guardam uma
referência para a função original antes de redefini-la, chamam essa
referência primeiro, e só then acrescentam o comportamento novo. Isso foi
verificado automaticamente: ESLint (`no-undef`, `no-redeclare`,
`no-dupe-keys`) rodado no app inteiro (68 arquivos, na ordem real de
carregamento) não aponta nenhum problema novo além do único já conhecido
e pré-existente (`renderFornecedores`, ver auditoria acima).

Duas entidades novas foram criadas (`medicoes`, `contratoDocumentos`),
registradas em `DB.KEYS` e incluídas em `CLOUD_SYNC_KEYS` — do mesmo jeito
que toda entidade existente já funciona, então sincronizam com a nuvem
igual às outras.

**Upload de documentos:** segue o mesmo padrão já usado em
`documentos.js`/`diario.js`/`rh.js` (arquivo lido como base64 via
`FileReader`, salvo no registro, sincronizado com a nuvem via CloudSync).
O pedido original mencionava "Supabase Storage", mas **nenhuma tela do
sistema hoje usa buckets reais do Supabase Storage** — implementar isso só
para este módulo seria um padrão arquitetural novo e divergente do resto do
app. Documentei isso e segui o padrão existente; migrar todos os uploads do
sistema (não só este módulo) para Supabase Storage real pode ser uma fase
futura separada.

**Onde encontrar cada coisa:**
| Arquivo | Responsabilidade |
|---|---|
| `js/modules/contratos/gc-00-schema.js` | Novas entidades, tipos de aditivo, cálculo de impacto financeiro |
| `js/modules/contratos/gc-01-contrato-form.js` | Campos novos do Contrato Principal + uploads |
| `js/modules/contratos/gc-02-aditivos.js` | Aditivos com 6 tipos e cálculo automático de valor/prazo |
| `js/modules/contratos/gc-03-medicoes.js` | Medições |
| `js/modules/contratos/gc-04-documentos.js` | Documentos do contrato |
| `js/modules/contratos/gc-05-timeline-historico.js` | Linha do Tempo + Histórico automático |
| `js/modules/contratos/gc-06-detalhe-tabs.js` | Monta os KPIs e as sub-abas no painel de detalhes |
| `js/modules/obras/gc-07-obra-contratos-tab.js` | Aba "Contratos" dentro do Painel da Obra |
| `js/modules/contratos/gc-08-dashboard.js` | Dashboard: KPIs, filtros, gráficos, drill-down |
| `js/modules/contratos/gc-09-filtro-tabela.js` | Liga os filtros do Dashboard também à tabela principal |

**Nuance de layout que vale saber:** no painel de detalhes do contrato, a
lista de "Aditivos" continua exatamente onde `aditivos.js` já a desenha
(logo abaixo do botão "Editar Contrato"), e as abas novas (Medições /
Documentos / Histórico) aparecem em uma faixa de abas logo abaixo disso —
em vez de "Aditivos" virar uma aba junto das outras três. Fiz essa escolha
para não precisar tocar em `aditivos.js`; se preferir Aditivos dentro da
mesma faixa de abas, é uma mudança pequena, mas exigiria reescrever a
função `showContratoDetail` de novo (violando "não altere módulo
existente" da forma mais literal). Me avise se quiser essa troca.

**Testado (estático, sem navegador):** sintaxe de todos os 68 arquivos na
ordem real de carregamento (`node --check`), zero identificador não
definido além do já conhecido, zero declaração duplicada entre os 68
arquivos, e os 8 arquivos CSS seguem com hash idêntico ao da versão
auditada anteriormente (ou seja, nenhum estilo foi alterado). Não tenho
acesso a navegador neste ambiente, então recomendo testar clicando pelo
menos: abrir uma obra → aba Contratos → abrir um contrato → Medições →
Documentos → Histórico; e a tela principal Contratos → Dashboard → clicar
em um indicador/gráfico para conferir o drill-down.

## Próximas fases (ainda não feitas)
- Fase 3 (componentização real) e Fase 4 (estrutura final) ainda serão
  concluídas: falta revisar nomes de arquivo, extrair componentes de UI
  repetidos (ex: padrão de modal, padrão de tabela) para funções
  reutilizáveis, e decidir o que fazer com as pastas sem conteúdo listadas
  acima.
- Nenhuma migração para ES Modules, bundler (Vite/Webpack) ou framework foi
  feita — o objetivo desta fase era reorganizar sem tocar em comportamento.

## Como abrir
Como o projeto usa `<script src>`/`<link>` relativos, ele precisa ser servido
por um servidor HTTP local (não abrir o `index.html` direto via `file://`,
porque alguns navegadores bloqueiam scripts locais por CORS). No VS Code, use
a extensão **Live Server**, ou rode:

```bash
cd erp
python3 -m http.server 8000
```

e acesse `http://localhost:8000`.
