# HANDOFF — Panetones que Rendem (Retoma entre Agentes)

## 1. Contexto Rápido
- **Repositório:** `/Users/arthurmagalhaes/.gemini/antigravity/scratch/panetone-lucrativo` (`arthurmglsource/panetone-lucrativo`)
- **Branch de trabalho:** `dev/produto-digital` (NUNCA alterar a branch `main` nem `index.html`, `*.css`, `*.js`, `assets/` ou `.vercel/` na raiz).
- **Landing page oficial (referência):** `https://panetone-lucrativo-indol.vercel.app/`

## 2. Onde Parámos (Checkpoint 03 — Fase 3 Concluída)
- **Fase 1 (Auditoria & Estrutura):** Concluída (`00-auditoria/` e `07-pesquisa-fontes/`).
- **Fase 2 (E-book Principal + 30 Receitas):** Concluída (`01-ebook-principal/`, 40 ficheiros Markdown PT-PT).
- **Fase 3 (3 Bónus, 2 Materiais Extras e 4 Extras Práticos):** **100 % concluída em texto, tabelas, CSVs e HTMLs editáveis PT-PT**:
  - **Bónus 01 — Lista de Compras (`04-bonus-lista-compras/`):** `bonus-01-lista-compras-10-30-50.md` + `lista-compras-editavel-10-30-50.csv` (derivados das receitas reais).
  - **Bónus 02 — Caderno de Encomendas (`05-bonus-caderno-encomendas/`):** `bonus-02-caderno-encomendas.md` + `caderno-encomendas-editavel.csv` (clientes, sinais MB WAY 50 %, datas e estados).
  - **Bónus 03 — Guia de Fornecedores PT (`06-bonus-guia-fornecedores/`):** `bonus-03-guia-fornecedores-portugal.md` + `comparador-fornecedores-editavel.csv` (fornecedores reais verificados em 2026-11-12 com links, sem preços inventados).
  - **Material Extra 01 — Kit de Divulgação (`02-kit-divulgacao/`):** `kit-divulgacao-natal-textos.md` + `modelos-visuais-editaveis/{card-whatsapp-abertura-editavel,post-feed-sabores-editavel,menu-natal-3-produtos-editavel}.html`.
  - **Material Extra 02 — Etiquetas (`03-etiquetas/`):** `guia-etiquetas-e-rotulagem-pt.md` + `etiquetas-editaveis-a4.html` (4 formatos + contrarótulos UE 1169/2011 sem inventar nutrição ou certificações).
  - **Extras Práticos (`09-extras-praticos/`):** `calculadora-custos-e-precos-{guia.md,editavel.csv}`, `calendario-producao-{e-entregas.md,entregas-editavel.csv}`, `checklist-primeira-encomenda.md` e `menu-natal-3-produtos-editavel.md`.

## 3. Tarefas Pendentes para o Próximo Agente (Fase 4 → Fase 5)
1. **Fase 4 — Compilação Gráfica e PDFs Finais (`produto-digital/`):** compilar o Guia Principal, Caderno das 30 Receitas, os 3 Bónus e os Materiais Extras em PDFs/HTMLs polidos com o logótipo oficial (`assets/logo-panetones-que-rendem.png`), identidade bordô/creme/dourado (`#4a0d16`, `#fff5e6`, `#e5a93b`) e elementos natalícios consistentes.
2. **Fase 5 — Aplicação Web Isolada (`app/`):** implementar a aplicação React/Vite/TS isolada com leitor modular, 30 fichas pesquisáveis, Calculadora de Lucro (`€`), Gerador de Lista 10/30/50, Caderno de Encomendas persistente, Menu/Etiquetas editáveis e Kit WhatsApp, preparada para deploy independente na Vercel.
3. **Fase 6 — QA Final:** auditar PDFs, app mobile (`320px–1280px`) e atualizar `08-qa/`.

## 4. Comando de Continuação
> *"Lê `panetones-que-rendem/PROGRESS.md`, `panetones-que-rendem/HANDOFF.md` e `panetones-que-rendem/00-auditoria/03-estrutura-editorial-e-app.md` na branch `dev/produto-digital` e executa a **Fase 4** (Compilação visual e PDFs finais em `produto-digital/`) seguida da **Fase 5** (`app/`), mantendo a landing page na branch `main` intacta."*
