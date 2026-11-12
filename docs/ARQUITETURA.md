# Arquitetura e Regras do Projeto — Panetones que Rendem

## 1. Estrutura Atual Inspecionada (Produção Preservada)
A raiz do repositório (`/`) contém a landing page estática em produção e **não deve ser alterada** durante o desenvolvimento do produto digital e da aplicação:

- **URL de Produção:** `https://panetone-lucrativo-indol.vercel.app/`
- **Repositório GitHub:** `arthurmglsource/panetone-lucrativo`
- **Projeto Vercel (Landing Page):** `mgl-arthur/panetone-lucrativo` (`prj_VZZzAKnLM5iFp5wNU7wvsIVL9WJI`), ligado à branch `main`.
- **Ficheiros da Landing Page (Intocáveis):**
  - `index.html`, `styles.css`, `refinements.css`, `mobile.css`, `animations.css`, `portugal.css`, `promotion.css`, `promotion.js`, `corrections.css`, `script.js`
  - `assets/` (42 ficheiros de marca, mockups, selos e ilustrações)
  - `.vercel/` (configuração local da landing page — não versionada)
- **Checkout configurado na landing:** `https://pay.hotmart.com/T108465363N?bid=1794510479145`

## 2. Identidade Visual Oficial (Extraída de `styles.css` e `index.html`)
- **Paleta de cores:**
  - `--wine`: `#4a0d16`
  - `--wine-deep`: `#27070d`
  - `--wine-soft`: `#6c2631`
  - `--gold`: `#e5a93b`
  - `--gold-light`: `#f5cf7a`
  - `--cream`: `#fff5e6`
  - `--cream-dark`: `#f3e5d1`
  - `--ink`: `#2c1a1c`
  - `--muted`: `#6e5b5a`
  - `--whatsapp`: `#25d366`
- **Tipografia:** `Inter` (Google Fonts, pesos 400–800) e `Anton`.
- **Assets oficiais reutilizáveis (em `/assets/`):**
  - Logo principal: `assets/logo-panetones-que-rendem.png`
  - Mockup oferta: `assets/mockup-oferta-panetones.png`
  - Banner módulos: `assets/banner-modulos-panetones-que-rendem.png`
  - Personagem da marca: `assets/ines-martins.png`
  - Materiais e Bónus: `assets/kit-divulgacao-final.png`, `assets/etiquetas-final.png`, `assets/bonus-compras-final.png`, `assets/bonus-encomendas-final.png`, `assets/bonus-fornecedores-final.png`
  - Selos: `assets/garantia-15-dias.png`, `assets/oferta-especial-999.png`

## 3. Conteúdo Prometido na Oferta (Base para `produto-digital/` e `app/`)
- **Guia Principal (6 Módulos):**
  1. Um Menu de Natal que Chama a Atenção (3 opções: panetone tradicional, versões de chocolate e sobremesa de panetone no copo)
  2. Massa sem Complicações
  3. Recheios e Coberturas (chocolate, creme de leite em pó, doce de leite, maracujá e avelã)
  4. Preços que Compensam (cálculo em euros incluindo ingredientes, embalagens, energia e tempo)
  5. O Método Encomenda Primeiro (modelos de mensagens WhatsApp, confirmação e sinal)
  6. Plano de Produção (exemplo para até 30 unidades num fim de semana)
- **Materiais Extras:**
  - Kit de Divulgação de Natal (imagens para estados do WhatsApp, mensagens e redes sociais)
  - Etiquetas para Embalagens (personalizáveis, com espaço para informação obrigatória)
- **3 Bónus:**
  - Bónus 01: Lista de Compras Organizada (10, 30 ou 50 unidades)
  - Bónus 02: Caderno de Encomendas (clientes, produtos, sinais e entregas)
  - Bónus 03: Guia de Fornecedores e Compras (Portugal)

## 4. Isolamento de Desenvolvimento (GitHub + Vercel)
- **Branch de desenvolvimento:** `dev/produto-digital` (a branch `main` permanece congelada para a landing page).
- **Pasta `produto-digital/`:** independente na raiz, dedicada aos e-books, bónus e materiais finais.
- **Pasta `app/`:** aplicação completamente isolada na raiz, com o seu próprio `package.json`, `.gitignore` e configuração própria para um **projeto Vercel separado** (configurado com Root Directory = `app/`), sem interferir com a raiz ou com `.vercel/` da landing page.
