# VORTEX ERP

Sistema de gestão para obras/serralheria (dashboard, obras, financeiro,
compras, estoque, RH, fornecedores, documentos, contratos/gestão
contratual, cronograma, diário de obra, relatórios, configurações).

**Código-fonte completo e editável** — sem build, sem bundler, sem
minificação. Abra este projeto direto no VS Code.

## Início rápido

```bash
python3 -m http.server 8000
```

Acesse `http://localhost:8000`. (Ou use a extensão Live Server do VS
Code — veja `.vscode/extensions.json`.)

## Documentação

- **`docs/ARQUITETURA.md`** — como o projeto é organizado, por que não
  tem `pages/`/`layouts/`, ordem de carregamento dos scripts, como rodar
  localmente, como configurar o Supabase.
- **`docs/HISTORICO-REFATORACAO.md`** — o histórico completo da
  refatoração do arquivo único original até esta estrutura (o que foi
  extraído de onde, validações feitas, auditoria técnica, e o módulo de
  Gestão Contratual).
- **`sql/schema.sql`** — schema de referência para configurar as tabelas
  no Supabase.

## Estrutura

```
index.html
styles/        core/        config/      database/    utils/
components/    services/    modules/     assets/
sql/           docs/        .vscode/
```

Detalhes de cada pasta em `docs/ARQUITETURA.md`.
