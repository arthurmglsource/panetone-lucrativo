# HANDOFF — Panetones que Rendem (Retoma entre Agentes)

## 1. Contexto Rápido
- **Repositório:** `/Users/arthurmagalhaes/.gemini/antigravity/scratch/panetone-lucrativo` (`arthurmglsource/panetone-lucrativo`)
- **Branch de trabalho:** `dev/produto-digital` (NUNCA alterar a branch `main` nem `index.html`, `*.css`, `*.js`, `assets/` ou `.vercel/` na raiz).
- **Landing page oficial (referência):** `https://panetone-lucrativo-indol.vercel.app/`

## 2. Onde Parámos (Checkpoint 04B — Upgrade Editorial Premium da Fase 4 Concluído)
- **Fase 1 (Auditoria & Estrutura):** Concluída (`00-auditoria/` e `07-pesquisa-fontes/`).
- **Fase 2 (E-book Principal + 30 Receitas):** Concluída (`01-ebook-principal/`, 40 ficheiros Markdown PT-PT).
- **Fase 3 (3 Bónus, 2 Materiais Extras e 4 Extras Práticos):** Concluída em texto, tabelas, CSVs e HTMLs editáveis PT-PT (`02`, `03`, `04`, `05`, `06`, `09`).
- **Revisão Técnica & Legal PT:** Concluída (`panetones-que-rendem/RELATORIO_VALIDACAO.md`) com correções em CSVs, pesos das receitas no copo e alinhamento ASAE/DGAV/ePortugal/AT.
- **Fase 4 (Upgrade Editorial Premium em `produto-digital/`):** **100 % concluída e verificada página a página**:
  - **4 recursos visuais próprios** gerados sem texto (`panetones-que-rendem/assets-editoriais/*.jpg`): 3 fotografias gastronómicas + 1 ilustração cartoon natalícia coerentes com o bordô/dourado/creme e logótipo oficial intocado.
  - Compilador reproduzível em `panetones-que-rendem/build_pdfs.py` (templates estruturados para fichas de receitas, grelhas 2 colunas, alertas semânticos, otimização de imagens e conversão PDF->PNG sem cortes via `PDFKit`).
  - **12 PDFs finais** em `produto-digital/`: `00-comece-aqui-guia-rapido.pdf` (3 págs.), `ebooks/01-ebook-completo-panetones-que-rendem.pdf` (99 págs. A4, 84 hiperligações navegáveis com os 6 módulos + 30 receitas completas), `ebooks/02-caderno-30-fichas-receitas.pdf` (62 págs. A4, 60 links), `bonus/bonus-01` (5 págs.), `bonus/bonus-02` (5 págs. A4 paisagem), `bonus/bonus-03` (5 págs., 20 links clicáveis), `materiais/guia-mensagens-whatsapp.pdf` (6 págs.), `materiais/caderno-operacional-custos-calendario-rotulagem.pdf` (8 págs.), `materiais/catalogo-natal-personalizavel.pdf` (1 pág. A4), `materiais/etiquetas-marca-propria-a4.pdf` (2 págs. A4), `materiais/kit-divulgacao-natal/{card-whatsapp-abertura,post-feed-sabores}.pdf`.
  - **3 imagens PNG prontas a partilhar** em `produto-digital/imagens/`: `card-whatsapp-abertura.png`, `post-feed-sabores.png` e `menu-natal-3-produtos.png`.
  - **9 ficheiros editáveis** organizados em `produto-digital/editaveis/` (5 `.csv` com fórmulas + 4 `.html` interativos `contenteditable`), inventariados em `produto-digital/README.md`.

## 3. Tarefas Pendentes para o Próximo Agente (Fase 5 → Fase 6)
1. **Fase 5 — Aplicação Web Isolada (`app/`):** implementar a aplicação React/Vite/TS isolada com leitor modular, 30 fichas pesquisáveis, Calculadora de Lucro (`€`), Gerador de Lista 10/30/50, Caderno de Encomendas persistente, Menu/Etiquetas editáveis e Kit WhatsApp, preparada para deploy independente na Vercel (`--prod` apenas no projeto próprio da app, nunca no da landing page).
2. **Fase 6 — QA Final:** auditar app responsiva (`320px–1280px`), build de produção, fluxos e atualizar `08-qa/`.

## 4. Comando de Continuação
> *"Lê `panetones-que-rendem/PROGRESS.md`, `panetones-que-rendem/HANDOFF.md`, `panetones-que-rendem/RELATORIO_VALIDACAO.md` e `panetones-que-rendem/00-auditoria/03-estrutura-editorial-e-app.md` na branch `dev/produto-digital` e executa a **Fase 5** (Aplicação Web Isolada em `app/`) seguida da **Fase 6** (QA Final), mantendo a landing page na branch `main` intacta."*


---

## Atualização — Checkpoint Fases 5 e 6 Concluídas (2026-11-12)

- **Estado atual:** Produto digital completo (`produto-digital/`) e aplicação Web PWA isolada (`app/`) finalizados e validados na branch `dev/produto-digital`. Landing page em `main` 100 % preservada.
- **Documentação principal:**
  - `panetones-que-rendem/08-qa/RELATORIO_QA_FINAL.md` — evidência de testes unitários (`9/9`), segurança API (`/api/content`, `/api/download`), build (`tsc -b && vite build`) e E2E visual mobile/desktop em Chrome Headless.
  - `app/INTEGRACAO_HOTMART_E_SEGURANCA.md` — variáveis de ambiente (`SESSION_SECRET`, `HOTMART_HOTTOK`, `KV_REST_API_*`, `BUYER_ACCESS_CODES`) e passos para deploy independente na Vercel (`Root Directory: app`).
- **Ação pendente de operação (infraestrutura):** criar o projeto Vercel separado apontado para `app/`, configurar as variáveis de ambiente e apontar o Webhook Hotmart conforme `app/INTEGRACAO_HOTMART_E_SEGURANCA.md`.
