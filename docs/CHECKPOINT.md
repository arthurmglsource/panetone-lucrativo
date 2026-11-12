# Checkpoint de Desenvolvimento — Panetones que Rendem

## Estado Atual: Checkpoint 04 — Revisão Técnica e Fase 4 (PDFs Finais & Pacote `produto-digital/`) Concluídas
- **Data:** 2026-11-12
- **Branch ativa:** `dev/produto-digital`
- **Branch `main` (Produção):** Preservada integralmente (`https://panetone-lucrativo-indol.vercel.app/`).

## Entregas Concluídas na Revisão Técnica & Fase 4
- **Auditoria & Validação (`panetones-que-rendem/RELATORIO_VALIDACAO.md`):** revisão de todas as 30 fichas, escalas 10/30/50, fórmulas dos CSVs (corrigido cálculo da coluna de saldo pendente e divisões por zero), enquadramento legal PT (ASAE/DGAV/ePortugal/AT) e ortografia PT-PT.
- **Compilação Gráfica (`panetones-que-rendem/build_pdfs.py` -> `produto-digital/`):**
  - `ebooks/01-guia-principal-panetones-que-rendem.pdf` (33 págs. A4) e `ebooks/02-caderno-30-fichas-receitas.pdf` (65 págs. A4).
  - `bonus/bonus-01-lista-compras-10-30-50.pdf` (5 págs.), `bonus-02-caderno-encomendas.pdf` (5 págs. A4 paisagem) e `bonus-03-guia-fornecedores-portugal.pdf` (6 págs.).
  - `materiais/`: `guia-mensagens-whatsapp.pdf` (6 págs.), `caderno-operacional-custos-calendario-rotulagem.pdf` (8 págs.), `catalogo-natal-personalizavel.pdf` (1 pág. A4), `etiquetas-marca-propria-a4.pdf` (2 págs. A4) e `kit-divulgacao-natal/{card-whatsapp-abertura,post-feed-sabores}.pdf`.
  - `editaveis/`: 5 folhas de cálculo `.csv` + 4 modelos `.html` interativos prontos a personalizar no navegador.

## Próximo Passo
- **Fase 5:** Desenvolver a aplicação web isolada em `app/` (React + Vite + TypeScript) preparada para deploy independente na Vercel, seguindo depois para a Fase 6 (QA Final).
