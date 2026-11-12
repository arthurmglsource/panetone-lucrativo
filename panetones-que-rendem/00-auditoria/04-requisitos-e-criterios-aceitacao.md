# 04 — Requisitos e Critérios de Aceitação

## 1. Requisitos Obrigatórios (Não-Funcionais e de Proteção)
- **REQ-01 (Isolamento de Produção):** Nenhuma alteração na branch `main`, nos ficheiros da landing page (`index.html`, `*.css`, `*.js`, `assets/`) ou no deploy Vercel `https://panetone-lucrativo-indol.vercel.app/`.
- **REQ-02 (Idioma e Moeda):** 100% em **Português de Portugal (PT-PT)** correto (ex.: *bónus*, *sinal*, *telemóvel*, *autocolantes*, *encomendas*, *pastelaria*, *açúcar*, *lacticínios*, *preços*), com valores em **euros (€)** formatados com vírgula decimal (`9,99 €`).
- **REQ-03 (Identidade Visual):** Paleta oficial (`#4a0d16` bordô, `#27070d` bordô profundo, `#e5a93b` dourado, `#fff5e6` creme, `#2c1a1c` texto escuro), tipografia `Inter` + `Anton` / editorial limpa, logótipo oficial `logo-panetones-que-rendem.png` e elementos natalícios cartoonizados coerentes com a landing.
- **REQ-04 (Honestidade Editorial):**
  - Identificar **Inês Martins** explicitamente como personagem ilustrativa da marca quando surgir.
  - Não inventar vendas reais, testemunhos verídicos, receitas "testadas com resultados garantidos", preços falsos de fornecedores ou certificações oficiais.
  - Distinguir sempre **exemplos ilustrativos / estimativas** de **custos e resultados reais**.
- **REQ-05 (Conformidade Portugal / UE):** Incluir alertas claros sobre obrigações fiscais (Portal das Finanças), segurança alimentar (ASAE / DGAV / HACCP) e rotulagem obrigatória de pré-embalados (Reg. UE 1169/2011, incluindo destaque de alergénios).

## 2. Requisitos Funcionais e Critérios de Aceitação dos Entregáveis

### A. E-books e Bónus PDF (`produto-digital/`)
- [ ] **CA-PDF-01:** Guia Principal com os 6 módulos completos, visual premium em bordô/creme/dourado, capa com logo oficial, índice clicável e paginação limpa em A4.
- [ ] **CA-PDF-02:** Caderno com as 30 Fichas de Receitas padronizadas em gramas/ml, contendo aviso de teste prévio no forno do utilizador e lista de alergénios por ficha.
- [ ] **CA-PDF-03:** Bónus 01 (Lista de Compras 10/30/50), Bónus 02 (Caderno de Encomendas) e Bónus 03 (Guia de Fornecedores e Compras PT) gerados em PDF de alta legibilidade em telemóvel e impressão A4.
- [ ] **CA-PDF-04:** Kit de Divulgação (artes exportadas sem texto cortado) e Etiquetas A4 prontas a imprimir/recortar, com espaço `"A sua marca"` + bloco de informação obrigatória.

### B. Aplicação Web (`app/`)
- [ ] **CA-APP-01:** Build independente em `app/` (`npm run build`) sem erros TypeScript/Vite e sem depender de ficheiros fora de `app/`.
- [ ] **CA-APP-02:** Responsividade total verificada em `320px`, `375px`, `768px` e `1280px` sem overflow horizontal.
- [ ] **CA-APP-03:** Calculadora de Lucro em € validada com testes matemáticos (custo total = ingredientes + embalagem + energia/extras; lucro = preço - custo; margem % correta).
- [ ] **CA-APP-04:** Caderno de Encomendas e Lista de Compras (10/30/50) com persistência funcional em `localStorage`, cálculo exato do valor em falta após sinal e exportação/impressão limpa.
- [ ] **CA-APP-05:** Gerador de Etiquetas permite editar nome da marca, produto, peso, ingredientes, alergénios, validade/lote e imprimir em A4.
- [ ] **CA-APP-06:** Pronta para deploy num projeto Vercel independente (Root Directory = `app/`).
