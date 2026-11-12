# 05 — Plano de Execução por Fases

Para preservar contexto e garantir qualidade premium com checkpoints verificáveis:

- **Fase 1 (Atual — Concluída nesta entrega):** Auditoria integral da página e visuais, criação da estrutura `panetones-que-rendem/` (ligada a `produto-digital/` e `app/`), matriz de promessas, pesquisa inicial PT-PT/técnica, requisitos, plano e ficheiros `PROGRESS.md` / `HANDOFF.md`.
- **Fase 2 — Pesquisa Técnica Aprofundada & Conteúdo Editorial Base:**
  - Redigir os 6 módulos do Guia Principal (`01-ebook-principal/`).
  - Redigir as 30 Fichas Técnicas de Receitas em gramas/ml com tempos, temperaturas, rendimento e alergénios (`01-ebook-principal/fichas-receitas.md` + `dados-receitas.json`).
  - Redigir anexo legal/fiscal Portugal e glossário de ingredientes PT-PT.
- **Fase 3 — Materiais Prontos a Usar (Kit de Divulgação & Etiquetas):**
  - Construir templates HTML/SVG imprimíveis e imagens para o Kit Vende Sozinho (`02-kit-divulgacao/`).
  - Construir templates A4 das Etiquetas de Marca Própria (`03-etiquetas/`).
  - Compilar textos e legendas prontas de WhatsApp/Redes Sociais.
- **Fase 4 — Os 3 Bónus Editoriais & Compilação dos PDFs (`produto-digital/`):**
  - Redigir e compilar Bónus 01 (Lista de Compras 10/30/50), Bónus 02 (Caderno de Encomendas) e Bónus 03 (Guia de Fornecedores PT).
  - Gerar todos os PDFs finais em `produto-digital/ebooks/`, `produto-digital/bonus/` e `produto-digital/materiais/` via motor HTML→PDF (Headless Chrome) e inspecionar visualmente as páginas geradas.
- **Fase 5 — Desenvolvimento da Aplicação Web Isolada (`app/`):**
  - Inicializar projeto Vite + React + TypeScript em `app/` com design system bordô/creme/dourado e logo oficial.
  - Implementar todos os módulos (Leitor dos 6 Módulos, 30 Receitas com escala, Calculadora de Lucro €, Gerador de Lista 10/30/50, Caderno de Encomendas, Calendário de Produção, Kit WhatsApp, Gerador de Etiquetas A4, Guia PT).
  - Preparar configuração Vercel independente para `app/`.
- **Fase 6 — QA Final, Validação Multi-Dispositivo & Entrega:**
  - Auditoria ortográfica PT-PT e verificação contra regras de veracidade.
  - Testes automatizados de cálculos + inspeção visual em `320px`, `375px` e `1280px` no browser headless.
  - Atualização final de `PROGRESS.md`, `HANDOFF.md` e commits organizados na branch `dev/produto-digital`.

