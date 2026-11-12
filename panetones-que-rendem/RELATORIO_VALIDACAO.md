# RELATÓRIO DE VALIDAÇÃO TÉCNICA — Panetones que Rendem (Natal 2026)

**Data da auditoria:** 12 de novembro de 2026  
**Branch auditada:** `dev/produto-digital` (landing page `main` preservada com `0` alterações)  
**Âmbito:** Auditoria integral de coerência editorial, completude, formulações de panificação, escalonamento (`10/30/50`), fórmulas em folha de cálculo (`CSV`), mensagens comerciais, português europeu (`PT-PT`), segurança alimentar e enquadramento legal/fiscal em Portugal — prévia ao design final e à compilação de PDFs/App.

---

## 1. Coerência entre Promessas da Landing Page e Entregáveis

| Promessa / Mockup (`index.html` + `assets/`) | Entregáveis Auditados | Estado |
| :--- | :--- | :---: |
| **6 Módulos do Método** (*Menu de Natal, Massa sem Complicações, Recheios e Coberturas, Preços que Compensam, Método Encomenda Primeiro, Plano de Produção 30 unid.*) | `01-ebook-principal/modulo-01-*.md` até `modulo-06-*.md` + `00-introducao-e-indice.md`, `07-primeiros-7-dias-e-checklist.md`, `08-glossario-e-faq.md` | Conforme |
| **30 Receitas e Fichas Técnicas** (tradicional, chocolate, recheados nos 5 sabores, mini e no copo) | `01-ebook-principal/receitas/README.md` + `01-*.md` a `30-*.md` (5 blocos distintos) | Conforme |
| **Bónus 01 — Lista de Compras Organizada (10, 30, 50 unid.)** | `04-bonus-lista-compras/bonus-01-lista-compras-10-30-50.md` + `lista-compras-editavel-10-30-50.csv` | Conforme |
| **Bónus 02 — Caderno de Encomendas** | `05-bonus-caderno-encomendas/bonus-02-caderno-encomendas.md` + `caderno-encomendas-editavel.csv` | Corrigido & Conforme |
| **Bónus 03 — Guia de Fornecedores e Compras (PT)** | `06-bonus-guia-fornecedores/bonus-03-guia-fornecedores-portugal.md` + `comparador-fornecedores-editavel.csv` | Corrigido & Conforme |
| **Material Extra 01 — Kit de Divulgação (*Kit Vende Sozinho*)** | `02-kit-divulgacao/kit-divulgacao-natal-textos.md` + `modelos-visuais-editaveis/*.html` | Corrigido & Conforme |
| **Material Extra 02 — Etiquetas Marca Própria** | `03-etiquetas/guia-etiquetas-e-rotulagem-pt.md` + `etiquetas-editaveis-a4.html` | Corrigido & Conforme |
| **Extras Práticos** (Menu 3 produtos, Calculadora EUR, Calendário 2026, Checklist 1.ª Encomenda) | `09-extras-praticos/*` + `menu-natal-3-produtos-editavel.html` | Corrigido & Conforme |

---

## 2. Verificação Técnica e Matemática Efetuada

### A. Panificação, Percentagens, Temperaturas e Rendimentos (`30 Receitas`)
- **Massas base (`Receitas 01–04`):** Proporções verificadas (`500 g` farinha de força `>= 12 %` prot. / Manitoba, `180–210 ml` líquido frio `4 °C–8 °C`, `24 %–26 %` açúcar, `24 %–26 %` manteiga `82 %` MG, `18 %–20 %` gemas, `5 %` mel, `1,6 %` sal, `5 %` fermento fresco / `1,6 %` seco na proporção aproximada `3:1`). Total de massa base sem inclusões ≈ `1.086 g` → `2×530–540 g` (formas `500 g`) ou `9–10` minis consoante inclusões.
- **Forno & *Tombamento*:** Faixa térmica validada (`160 °C–170 °C`), controlo interno obrigatório com sonda a **`92 °C–94 °C`** (`93 °C–95 °C` no Salgado Natalício R04) e arrefecimento invertido (**`8–12 h`**) nas formas de `500 g`.
- **Recheios (`Receitas 11–18`) e Minis (`Receitas 19–24`):** Pesos de recheio (`~240–260 g` por grande de `500 g` / `~38–40 g` por mini) e tempos reduzidos de cozedura de minis (`18–23 min` a `170 °C`) consistentes entre módulos e fichas.
- **Panetone no Copo (`Receitas 25–30`):** Somadas camada a camada as gramagens de montagem (`cubos + calda + creme/mousse + cobertura/topo`). Ajustados os cabeçalhos das **Receitas 25, 28 e 29** para refletir exatamente os totais reais (`~220–230 g`, `~215–220 g` e `~210 g`).

### B. Consistência de Escalonamento (`Bónus 01` vs. `Módulo 06`)
- Validada a derivação matemática exata a partir da **Receita 01**:
  - **Lote 10 (`2,5× R01`):** `1,25 kg` farinha, `450 ml` leite, `300 g` açúcar, `300 g` manteiga, `225 g` gemas (`~12 ovos L`), `62,5 g` fermento fresco (`3 cubos`), `20 g` sal.
  - **Lote 30 (`8,8× R01` — igual ao plano operacional do Módulo 06):** `4,40 kg` farinha, `1,58 L` (`~1,60 L`) leite, `1,06 kg` açúcar, `1,06 kg` manteiga, `792 g` gemas (`~42 ovos L`), `220 g` fermento fresco (`9 cubos`), `70 g` sal; `6 copos` alimentados diretamente pelo miolo escavado dos `8 recheados` (`8×~65 g ≈ 520 g` > `420 g` necessários).
  - **Lote 50 (`14,5× R01`):** `7,25 kg` farinha, `2,61 L` (`~2,65 L`) leite, `1,74 kg` açúcar, `1,74 kg` manteiga, `1,31 kg` gemas (`~70 ovos L`), `362,5 g` fermento fresco (`15 cubos`), `116 g` sal.
  - Validada também a **Tabela B** (10/30/50 unidades todas de `500 g` = `5× / 15× / 25× R01`).

### C. Fórmulas de Custos, Margens e Ficheiros CSV (`Módulo 04`, `Bónus 02`, `Bónus 03`, `Extras`)
- Confirmada a coerência da simulação do mockup (`4,20 €` ingredientes c/ quebra + `0,80 €` embalagem = `5,00 €` direto; `8,00 € × 1,05 / 2 = 4,20 €` na linha de exemplo da Calculadora) e da simulação de fim de semana (`10×12,50 + 20×4,50 + 10×5,00 = 265,00 €`).
- Auditadas todas as colunas (`A..Q`) e referências de célula dos **5 ficheiros `.csv`** via script Python (`csv` + conferência de índices).

---

## 3. Correções Efetuadas nos Ficheiros de Origem

1. **BUG CRÍTICO CORRIGIDO — `05-bonus-caderno-encomendas/caderno-encomendas-editavel.csv`:**
   - As linhas `001–030` na coluna `K` (`Valor_Em_Falta_EUR`) tinham `=G4-I4` (subtraindo texto `"SIM"/"NAO"` da coluna `I`, o que gerava `#VALUE!` em folha de cálculo). Corrigido para `=IF(I4="SIM",G4-H4,G4)` em todas as linhas (`K2:K33`), `H4:H33` para `=G4*0.5` e resumo `H34` para `=SUMIF(I4:I33,"SIM",H4:H33)`.
2. **BUG `#DIV/0!` CORRIGIDO — `06-bonus-guia-fornecedores/comparador-fornecedores-editavel.csv`:**
   - Adicionada proteção `=IF(E2>0,(D2+F2)/E2,0)` e `=IF(J2>0,(I2+K2)/J2,0)` nas colunas `G` e `L`, mais `=IF(AND(E2>0,J2>0),IF(G2<=L2,C2,H2),"")` na coluna `M`.
3. **PROTEÇÃO `#DIV/0!` ADICIONADA — `09-extras-praticos/calculadora-custos-e-precos-editavel.csv`:**
   - Protegidas as colunas `E` (`=IF(B2>0,(C2+D2)/B2,0)`) e `N` (`=IF(M2<1,L2/(1-M2),0)`).
4. **CONSISTÊNCIA DE RECEITAS & PT-PT:**
   - Corrigida gralha `feullietine` → `feuilletine` na Receita 23; substituído espanholismo `barquillo` por `folhado crocante (*feuilletine*) ou bolacha *wafer*` na Receita 29; ajustados os pesos líquidos esperados por copo nas Receitas 25 (`~220–230 g`), 28 (`~215–220 g`) e 29 (`~210 g`).
   - Substituído `"Team"` por `"Equipa"` em `02-kit-divulgacao/kit-divulgacao-natal-textos.md`.
5. **ATUALIZAÇÃO LEGAL/FISCAL PORTUGAL (ASAE / DGAV / ePortugal / AT):**
   - Atualizados `07-primeiros-7-dias-e-checklist.md`, `08-glossario-e-faq.md`, `03-etiquetas/guia-etiquetas-e-rotulagem-pt.md` e `03-etiquetas/etiquetas-editaveis-a4.html` com referências explícitas ao **Cap. III Anexo II e Art. 6.º do Reg. (CE) n.º 852/2004**, **SIR (Tipo 3) / ePortugal**, restrições da **ASAE** ao uso enganoso de *"caseiro"/"artesanal"* (alterando o texto padrão das etiquetas para *"Produção própria"*), distinção legal entre *"Consumir de preferência antes de"* vs. *"Consumir até"* e patamares vigentes orientativos do **Artigo 53.º do CIVA** (`15.000 €` / tolerância `18.750 €`).

---

## 4. Fontes Oficiais e Técnicas Consultadas (Verificadas em 2026-11-12)

- **ASAE (Autoridade de Segurança Alimentar e Económica):** Rotulagem de géneros alimentícios, língua portuguesa obrigatória, destaque de alergénios (Anexo II Reg. UE 1169/2011), restrições a menções como *"caseiro"* / *"artesanal"*, e distinção entre data de durabilidade mínima e data-limite de consumo (`asae.gov.pt`).
- **DGAV (Direção-Geral de Alimentação e Veterinária) & Reg. (CE) n.º 852/2004:** Registo de estabelecimentos alimentares (Art. 6.º), requisitos de preparação alimentar em habitação privada (Anexo II, Cap. III), princípios HACCP e enquadramento em prédios de habitação (`dgav.pt`).
- **ePortugal / gov.pt & SIR:** Regime do Sistema da Indústria Responsável (DL n.º 169/2012 / DL n.º 73/2015) e procedimentos eletrónicos via Balcão do Empreendedor / Câmara Municipal (`eportugal.gov.pt`, `gov.pt`).
- **Autoridade Tributária e Aduaneira / Artigo 53.º CIVA (via fontes contabilísticas portuguesas CC/OCC 2025–2026):** Regime Especial de Isenção de IVA (`15.000 €` anuais de referência, margem até `18.750 €` no ano em curso e exclusão imediata acima desse limiar), com recomendação obrigatória de confirmação junto do Portal das Finanças ou Contabilista Certificado.
- **Fornecedores Portugueses Reais:** Verificados em `06-bonus-guia-fornecedores/bonus-03-guia-fornecedores-portugal.md` (12/11/2026).

---

## 5. Pendências Obrigatórias de Validação Física (Antes da Comercialização)

Como este projeto é desenvolvido autonomamente em ambiente digital, **os itens abaixo permanecem sinalizados como orientativos e exigem validação física pelo produtor** antes de vender:

1. **Calibração de forno doméstico e tempos reais:** Confirmar a temperatura real do forno do utilizador (especialmente fornos a gás ou ventilados) e validar o tempo exato necessário para atingir `92 °C–94 °C` no centro de formas `500 g` e `18–23 min` em formas `mini`.
2. **Desempenho da farinha adquirida:** Confirmar na cozinha o comportamento da marca exata de farinha (`Manitoba` vs. `T55/T65` portuguesa) em ponto de véu e *tombamento*.
3. **Testes reais de estabilidade e validade (Shelf-life):** Validar fisicamente durante `3 a 8 dias` (em ambiente fresco para simples e a `<= 5 °C` para recheados e copos) ausência de bolor, retrogradação prematura ou *sinérese* (libertação de líquido nos recheios de fruta/natas) antes de fixar datas nas etiquetas.
4. **Pesagem e custos locais em EUR:** Preencher a Calculadora e o Comparador de Fornecedores com talões reais locais (a `0,00 €` nos ficheiros em branco) antes de definir preços finais no Menu de Natal.
5. **Enquadramento municipal, registo DGAV/SIR e contabilista:** Confirmar especificamente na Câmara Municipal da área de residência e com um Contabilista Certificado o registo aplicável ao espaço produtivo concreto.

---

**Parecer Final de QA:** Aprovado para avançar para a **Fase 4 — Design Gráfico e Compilação Final em `produto-digital/`** com todas as correções já aplicadas nos ficheiros de origem.
