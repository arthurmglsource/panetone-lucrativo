# Panetones que Rendem — Produto Digital Completo & Aplicação Web PWA (Natal 2026 · Portugal)

Produto digital completo em português europeu (**PT-PT**) e euros (**€**), concebido para acompanhar a landing page oficial **Panetones que Rendem** mantendo a página de vendas em produção (`main`) 100 % isolada e intacta.

---

## Resumo da Arquitetura do Repositório (`dev/produto-digital`)

| Pasta / Ficheiro | Finalidade | Isolamento |
| :--- | :--- | :--- |
| `index.html`, `styles.css`, `assets/`, `.vercel/` | Landing page oficial de vendas | **Intocada** na branch `main` (`0` alterações) |
| `panetones-que-rendem/` | Fontes editoriais em Markdown, 30 fichas de receitas, validação PT-PT, imagens e compilador `build_pdfs.py` | Branch `dev/produto-digital` |
| `produto-digital/` | Pacote compilado: 11 PDFs, 3 PNGs, 5 CSVs e 4 editáveis HTML (`24` entregáveis + `README.md`) | Branch `dev/produto-digital` |
| `entrega-hotmart/` | Estrutura de módulos pronta para upload no Hotmart Club + ZIP verificado (`Pacote-Completo-Panetones-que-Rendem.zip`, `21.72 MB`) | Branch `dev/produto-digital` |
| `app/` | Aplicação Web Mobile-First / PWA (React 19 + Vite 6 + TypeScript) com backend serverless `app/api/` e `INTEGRACAO_HOTMART_E_SEGURANCA.md` | Projeto Vercel independente (`Root Directory: app`) |
| `docs/` | Documentação de entrega Hotmart, relatório integral de QA, pendências reais e handoff | Branch `dev/produto-digital` |

---

## Funcionalidades Incluídas no Produto

1. **E-book Principal (6 Módulos + 30 Receitas):**
   - `M01`: Menu de Natal que Vende (3 faixas em €)
   - `M02`: Massa sem Complicações (método direto, esponja, chocolate, salgado e ponto de véu)
   - `M03`: Recheios e Coberturas (chocolate, leite em pó, doce de leite, maracujá e avelã; versões clássicas, recheadas, minis e no copo)
   - `M04`: Preços que Compensam (fórmulas reais de custos, quebras, embalagens, energia, mão de obra em €)
   - `M05`: Método Encomenda Primeiro (WhatsApp, condições e sinal de 50 % por MB WAY)
   - `M06`: Plano de Produção (lote exemplo de `30 unidades` num fim de semana)
2. **Três Bónus PDF + Folhas CSV Editáveis:**
   - **Bónus 01:** Lista de Compras Organizada (`10 / 30 / 50` unidades)
   - **Bónus 02:** Caderno de Encomendas (sinais MB WAY, saldos e entregas)
   - **Bónus 03:** Guia de Fornecedores e Compras em Portugal (`17` lojas/canais verificados em `2026-11-12`)
3. **Materiais Práticos:** Kit de Divulgação de Natal (PDFs, PNGs 9:16 e 1:1, textos e HTML editável), Etiquetas Personalizáveis A4 (inclui rotulagem orientativa Reg. UE 1169/2011 / ASAE), Calculadora de Custos CSV e Calendário de Produção/Entregas 2026.
4. **Aplicação Web PWA (`app/`):** Início, 30 Receitas (pesquisa, filtros e favoritos), Modo Cozinha passo a passo com temporizadores e Wake Lock, Escalonamento de quantidades, Calculadora de Preços (€), Gestor de Encomendas (sinal 50 % MB WAY), Lista de Compras automática, Calendário de Produção, Catálogo de Natal com exportação PNG/WhatsApp/PDF e Biblioteca de Bónus protegida por sessão `HttpOnly`, incluindo **Modo Demonstração QA seguro** (2 receitas de amostra sem expor a biblioteca paga).

---

## Inventário Completo de Ficheiros Finais

### 1. Pacote Compilado (`produto-digital/`)
- `produto-digital/00-comece-aqui-guia-rapido.pdf` (`832.0 KB` | ~3 págs.)
- `produto-digital/README.md` (`4.1 KB`)
- `produto-digital/ebooks/01-ebook-completo-panetones-que-rendem.pdf` (`6.63 MB` | ~99 págs.)
- `produto-digital/ebooks/02-caderno-30-fichas-receitas.pdf` (`4.27 MB` | ~62 págs.)
- `produto-digital/bonus/bonus-01-lista-compras-10-30-50.pdf` (`1.05 MB` | ~5 págs.)
- `produto-digital/bonus/bonus-02-caderno-encomendas.pdf` (`688.7 KB` | ~5 págs.)
- `produto-digital/bonus/bonus-03-guia-fornecedores-portugal.pdf` (`841.8 KB` | ~5 págs.)
- `produto-digital/materiais/caderno-operacional-custos-calendario-rotulagem.pdf` (`1.00 MB` | ~8 págs.)
- `produto-digital/materiais/catalogo-natal-personalizavel.pdf` (`282.5 KB` | ~1 pág.)
- `produto-digital/materiais/etiquetas-marca-propria-a4.pdf` (`490.9 KB` | ~2 págs.)
- `produto-digital/materiais/guia-mensagens-whatsapp.pdf` (`1001.7 KB` | ~6 págs.)
- `produto-digital/materiais/kit-divulgacao-natal/card-whatsapp-abertura.pdf` (`160.9 KB` | ~1 pág.)
- `produto-digital/materiais/kit-divulgacao-natal/post-feed-sabores.pdf` (`126.5 KB` | ~1 pág.)
- `produto-digital/imagens/card-whatsapp-abertura.png` (`6.21 MB` | `2160×3840`)
- `produto-digital/imagens/menu-natal-3-produtos.png` (`1.63 MB` | `2380×3368`)
- `produto-digital/imagens/post-feed-sabores.png` (`2.50 MB` | `2160×2160`)
- `produto-digital/editaveis/caderno-encomendas-editavel.csv` (`2.9 KB` · UTF-8 BOM)
- `produto-digital/editaveis/calculadora-custos-e-precos-editavel.csv` (`1.6 KB` · UTF-8 BOM)
- `produto-digital/editaveis/calendario-producao-entregas-editavel.csv` (`1.6 KB` · UTF-8 BOM)
- `produto-digital/editaveis/comparador-fornecedores-editavel.csv` (`2.6 KB` · UTF-8 BOM)
- `produto-digital/editaveis/lista-compras-editavel-10-30-50.csv` (`2.8 KB` · UTF-8 BOM)
- `produto-digital/editaveis/card-whatsapp-abertura-editavel.html` (`6.1 KB`)
- `produto-digital/editaveis/etiquetas-editaveis-a4.html` (`16.6 KB`)
- `produto-digital/editaveis/menu-natal-3-produtos-editavel.html` (`7.4 KB`)
- `produto-digital/editaveis/post-feed-sabores-editavel.html` (`5.0 KB`)

### 2. Pacote Hotmart (`entrega-hotmart/`)
- `entrega-hotmart/Pacote-Completo-Panetones-que-Rendem.zip` (`21.72 MB` · 25 ficheiros empacotados e verificados com `unzip -tq`)
- `entrega-hotmart/Pacote-Organizado-Hotmart/01-Comece-Aqui-e-App/00-comece-aqui-guia-rapido.pdf`
- `entrega-hotmart/Pacote-Organizado-Hotmart/01-Comece-Aqui-e-App/INSTRUCOES-ACESSO-APP-E-SUPORTE.md`
- `entrega-hotmart/Pacote-Organizado-Hotmart/02-Ebook-Principal-e-Receitas/` (`01-ebook-completo...pdf`, `02-caderno-30-fichas...pdf`)
- `entrega-hotmart/Pacote-Organizado-Hotmart/03-Bonus-Exclusivos/` (`bonus-01...pdf`, `bonus-02...pdf`, `bonus-03...pdf`)
- `entrega-hotmart/Pacote-Organizado-Hotmart/04-Kit-Divulgacao-e-Imagens/` (`guia-mensagens-whatsapp.pdf`, `catalogo-natal-personalizavel.pdf`, `card-whatsapp-abertura.{pdf,png}`, `post-feed-sabores.{pdf,png}`, `menu-natal-3-produtos.png`)
- `entrega-hotmart/Pacote-Organizado-Hotmart/05-Etiquetas-e-Gestao-Operacional/` (`caderno-operacional...pdf`, `etiquetas-marca-propria-a4.pdf`)
- `entrega-hotmart/Pacote-Organizado-Hotmart/06-Folhas-Editaveis-CSV-e-HTML/` (5 CSVs com UTF-8 BOM + 4 HTMLs editáveis)

### 3. Aplicação Web PWA (`app/`) e Documentação (`docs/`)
- Frontend React/TS (`app/src/`), Middleware local (`app/server/`), Funções Serverless Vercel (`app/api/`), Sincronização (`app/scripts/sync-content.mjs`), Dados Protegidos (`app/protected-data/{content,demo-content}.json` e `app/protected-downloads/` com 24 artefactos)
- Documentos de operação e QA:
  - [MANUAL_HOTMART.md](file:///Users/arthurmagalhaes/.gemini/antigravity/scratch/panetone-lucrativo/docs/MANUAL_HOTMART.md)
  - [RELATORIO_QA.md](file:///Users/arthurmagalhaes/.gemini/antigravity/scratch/panetone-lucrativo/docs/RELATORIO_QA.md)
  - [PENDENCIAS.md](file:///Users/arthurmagalhaes/.gemini/antigravity/scratch/panetone-lucrativo/docs/PENDENCIAS.md)
  - [HANDOFF.md](file:///Users/arthurmagalhaes/.gemini/antigravity/scratch/panetone-lucrativo/docs/HANDOFF.md)
  - [INTEGRACAO_HOTMART_E_SEGURANCA.md](file:///Users/arthurmagalhaes/.gemini/antigravity/scratch/panetone-lucrativo/app/INTEGRACAO_HOTMART_E_SEGURANCA.md)

---

## Como Executar e Testar Localmente (`app/`)

```bash
cd app
npm install
npm run sync      # Sincroniza content.json, demo-content.json e 24 downloads protegidos
npm test          # Executa os testes unitários e de segurança (Vitest)
npm run build     # Valida TypeScript (tsc -b) e gera build de produção em dist/
BUYER_MASTER_CODE="SEU-CODIGO-LOCAL" npm run dev
```
