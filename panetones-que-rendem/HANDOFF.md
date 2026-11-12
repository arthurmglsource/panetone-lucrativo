# HANDOFF — Panetones que Rendem (Retoma entre Agentes)

## 1. Contexto Rápido
- **Repositório:** `/Users/arthurmagalhaes/.gemini/antigravity/scratch/panetone-lucrativo` (`arthurmglsource/panetone-lucrativo`)
- **Branch de trabalho:** `dev/produto-digital` (NUNCA alterar a branch `main` nem `index.html`, `*.css`, `*.js`, `assets/` ou `.vercel/` na raiz).
- **Landing page oficial (referência):** `https://panetone-lucrativo-indol.vercel.app/`

## 2. Onde Parámos (Checkpoint 04 — Revisão Técnica & Fase 4 Concluídas)
- **Fase 1 (Auditoria & Estrutura):** Concluída (`00-auditoria/` e `07-pesquisa-fontes/`).
- **Fase 2 (E-book Principal + 30 Receitas):** Concluída (`01-ebook-principal/`, 40 ficheiros Markdown PT-PT).
- **Fase 3 (3 Bónus, 2 Materiais Extras e 4 Extras Práticos):** Concluída em texto, tabelas, CSVs e HTMLs editáveis PT-PT (`02`, `03`, `04`, `05`, `06`, `09`).
- **Revisão Técnica & Legal PT:** Concluída (`panetones-que-rendem/RELATORIO_VALIDACAO.md`) com correções em CSVs, pesos das receitas no copo e alinhamento ASAE/DGAV/ePortugal/AT.
- **Fase 4 (Compilação Gráfica & Pacote Final em `produto-digital/`):** **100 % concluída e verificada visualmente**:
  - Compilador reproduzível em `panetones-que-rendem/build_pdfs.py` (HTML+CSS bordô/creme/dourado + logótipo oficial -> Chrome Headless `--print-to-pdf`).
  - **11 PDFs finais** compilados em `produto-digital/{ebooks,bonus,materiais}/` (incluindo Guia Principal 33 págs., Caderno das 30 Receitas 65 págs., Lista de Compras 10/30/50 5 págs., Caderno de Encomendas A4 paisagem 5 págs., Guia de Fornecedores PT 6 págs., Guia WhatsApp 6 págs., Kit Operacional/Rotulagem 8 págs., Menu 3 Produtos 1 pág. A4, Etiquetas Marca Própria 2 págs. A4, Card WhatsApp 9:16 e Post Feed 1:1).
  - **9 ficheiros editáveis** organizados em `produto-digital/editaveis/` (5 `.csv` com fórmulas + 4 `.html` interativos `contenteditable`), inventariados em `produto-digital/README.md`.

## 3. Tarefas Pendentes para o Próximo Agente (Fase 5 → Fase 6)
1. **Fase 5 — Aplicação Web Isolada (`app/`):** implementar a aplicação React/Vite/TS isolada com leitor modular, 30 fichas pesquisáveis, Calculadora de Lucro (`€`), Gerador de Lista 10/30/50, Caderno de Encomendas persistente, Menu/Etiquetas editáveis e Kit WhatsApp, preparada para deploy independente na Vercel (`--prod` apenas no projeto próprio da app, nunca no da landing page).
2. **Fase 6 — QA Final:** auditar app responsiva (`320px–1280px`), build de produção, fluxos e atualizar `08-qa/`.

## 4. Comando de Continuação
> *"Lê `panetones-que-rendem/PROGRESS.md`, `panetones-que-rendem/HANDOFF.md`, `panetones-que-rendem/RELATORIO_VALIDACAO.md` e `panetones-que-rendem/00-auditoria/03-estrutura-editorial-e-app.md` na branch `dev/produto-digital` e executa a **Fase 5** (Aplicação Web Isolada em `app/`) seguida da **Fase 6** (QA Final), mantendo a landing page na branch `main` intacta."*
