# 03 — Estrutura Editorial dos E-books, Materiais e Aplicação

## 1. Arquitetura Editorial dos E-books e Bónus (`produto-digital/`)

### Volume 1 — Guia Principal: *Panetones que Rendem — Método Encomenda Primeiro*
1. **Capa & Boas-Vindas** (Logótipo oficial, Inês Martins apresentada como personagem ilustrativa da marca, nota de utilização e avisos de responsabilidade).
2. **Módulo 01 — Um Menu de Natal que Chama a Atenção:** como estruturar 3 opções com preços distintos (Tradicional de Frutas, Chocolate/Gourmet, Panetone no Copo sem fermentação de raiz).
3. **Módulo 02 — Massa sem Complicações:** ciência prática da massa rica, farinhas em Portugal (porque T55 comum falha vs farinha de força W / Manitoba), fermento fresco vs seco, passo a passo, tempos, temperaturas e guia de resolução de 10 erros comuns.
4. **Módulo 03 — Recheios e Coberturas:** técnica de corte/enchimento, ponto de brigadeiro/ganache estruturado, receitas base dos 5 recheios anunciados (chocolate, creme de leite em pó, doce de leite, maracujá e avelã) + coberturas e validade/conservação.
5. **Módulo 04 — Preços que Compensam:** estrutura de custos em EUR (ingredientes, perdas, embalagens, forno/eletricidade, tempo de trabalho), fórmula de preço de venda, explicação da simulação ilustrativa dos 265 € e erros de precificação.
6. **Módulo 05 — O Método Encomenda Primeiro:** fluxo completo em 4 passos (menu → divulgação → sinal por MB WAY/transferência → compra e entrega), regras claras para evitar desperdício, scripts prontos de WhatsApp para cada fase.
7. **Módulo 06 — Plano de Produção:** cronograma detalhado de sexta a domingo para até 30 unidades num fim de semana, gestão de forno doméstico, arrefecimento, montagem e entregas.
8. **Anexo Técnico Portugal:** boas práticas de higiene (HACCP simplificado), rotulagem obrigatória (Reg. UE 1169/2011) e resumo de obrigações fiscais/registo antes de comercializar.

### Volume 2 — *Caderno de 30 Fichas de Receitas Artesanais*
- **Bloco A (Fichas 01–04):** Massas Base e Preparos Auxiliares (Massa Tradicional Método Direto, Massa Método Esponja/Prefermento, Massa de Cacau, Calda/Xarope de Humedecimento).
- **Bloco B (Fichas 05–10):** Panetones Clássicos e Frutados (Tradicional Frutas Cristalizadas, Laranja e Passas, Limão e Amêndoa, Maçã e Canela, Especiarias de Natal, Tradicional Sem Frutas Cristalizadas).
- **Bloco C (Fichas 11–18):** Chocotones e Recheados Premium (Gotas de Chocolate Clássico, Chocolate Duplo, Trufado de Chocolate Negro, Creme de Leite em Pó, Doce de Leite Cremoso, Maracujá com Chocolate Branco, Creme de Avelã, Chocolate e Caramelo Salgado).
- **Bloco D (Fichas 19–24):** Mini Panetones (100g–150g para lembranças e empresas).
- **Bloco E (Fichas 25–30):** Sobremesas de Panetone no Copo (sem massa levedada de raiz — montagem com base pronta/bolo de especiarias + 6 combinações de cremes e coberturas para encomendas rápidas).
- *Cada ficha inclui:* rendimento, peso unitário, ingredientes em gramas/ml, modo de preparação passo a passo, conservação orientativa, alergénios principais e nota de teste prévio.

### Materiais Complementares (`materiais/`)
- **Kit de Divulgação de Natal (*Kit Vende Sozinho*):**
  - 6 cartões verticais (1080×1920) para Estados do WhatsApp / Instagram Stories (em HTML/PNG/PDF imprimível).
  - 4 cartões quadrados (1080×1080) para Feed / catálogo WhatsApp.
  - Guia de textos e legendas prontas para WhatsApp (estados, lista de transmissão, grupos, resposta a pedidos e fecho de sinal).
- **Catálogo de Natal Personalizável:** ficha de 3 produtos em PDF/HTML editável para enviar aos clientes.
- **Etiquetas de Marca Própria:** folhas A4 prontas a imprimir e cortar com os 5 formatos mostrados na landing (`selo caixa`, `cinta de embalagem`, `tag retangular`, `tag redonda recortada`, `autocolantes redondos`), incluindo versão em branco para preencher e versão com blocos de **informação alimentar obrigatória** (alergénios, peso, validade, lote, identificação do produtor).

### Os 3 Bónus (`bonus/`)
- **Bónus 01 — Lista de Compras Organizada:** tabelas quantitativas de referência para lotes de **10, 30 e 50 unidades** (ingredientes secos, frescos, recheios, formas de papel, sacos, fitas, caixas e etiquetas).
- **Bónus 02 — Caderno de Encomendas:** folhas de registo imprimíveis (Capa + Tabela `Cliente | Contacto | Pedido | Valor Total (€) | Sinal (€) | Restante (€) | Data/Hora Entrega | Estado`) + resumo semanal de produção.
- **Bónus 03 — Guia de Fornecedores e Compras (Portugal):** guia prático do que verificar antes de comprar (leitura de cinzas/força da farinha, percentagem de cacau no chocolate, tipos de formas forneáveis, tipos de compra em supermercados, cash & carry, lojas de pastelaria e embalagens em Portugal) + folha de comparação de custos por kg/unidade.

---

## 2. Arquitetura da Aplicação Web Isolada (`app/`)

- **Stack sugerida:** React + Vite + TypeScript (ou Next.js App Router — estática/SPA leve com persistência em `localStorage`, exportação/importação JSON e impressão CSS `@media print` dedicada para gerar PDFs/etiquetas diretamente do browser).
- **Páginas / Módulos da Aplicação:**
  1. **Painel Inicial (Boas-vindas & Progresso):** resumo da jornada em 4 passos + checklist de arranque + acessos rápidos.
  2. **Guia & Módulos (6 Módulos):** leitura confortável mobile/desktop, destaques, progresso guardado.
  3. **30 Fichas de Receitas:** filtros por categoria, busca, conversor de escala (×1, ×2, ×3 lotes) e vista de impressão.
  4. **Calculadora de Lucro (€):** inputs dinâmicos de ingredientes, formas, embalagens, energia, tempo e margem → custo unitário, preço sugerido e lucro unitário em euros.
  5. **Caderno de Encomendas & Lista de Compras (10/30/50):** gestor de pedidos com controlo de sinal MB WAY e cálculo automático da lista de compras para 10, 30 ou 50 unidades (ou lote personalizado).
  6. **Calendário de Produção:** plano de fim de semana (30 unidades) com checkboxes por turno.
  7. **Kit de Divulgação, Catálogo & Etiquetas:** copiar scripts WhatsApp com 1 clique, personalizar menu de 3 opções e gerar/imprimir folha A4 de etiquetas com dados da marca + rotulagem obrigatória.
  8. **Guia de Compras PT & Checklist Legal:** referência rápida de fornecedores/ingredientes e enquadramento ASAE/Finanças.

