# 06 — Fontes, Pressupostos e Limitações

## 1. Fontes Utilizadas e Verificadas
- **Fonte Primária do Produto:** Landing page oficial em `https://panetone-lucrativo-indol.vercel.app/` (branch `main`, ficheiros `index.html`, `styles.css`, `assets/*`).
- **Identidade e Assets Visuais:** Analisados diretamente nos ficheiros PNG em `/assets/` (`logo-panetones-que-rendem.png`, `mockup-oferta-panetones.png`, `kit-divulgacao-final.png`, `etiquetas-final.png`, `bonus-compras-final.png`, `bonus-encomendas-final.png`, `bonus-fornecedores-final.png`, `ines-martins.png`).
- **Fontes Técnicas e Legais Portuguesas (pesquisadas em 2026-11-12 — ver detalhe em `07-pesquisa-fontes/fontes-portugal.md`):**
  - **ASAE (Autoridade de Segurança Alimentar e Económica):** enquadramento de rotulagem de produtos artesanais/caseiros e restrições ao uso de termos como "caseiro" ou "artesanal" sem enquadramento adequado.
  - **Regulamento (UE) n.º 1169/2011:** menções obrigatórias em géneros alimentícios pré-embalados (denominação, lista de ingredientes em ordem decrescente, alergénios em destaque visual, quantidade líquida, durabilidade mínima/consumo, conservação, operador alimentar, origem quando aplicável, declaração nutricional e lote).
  - **Regulamento (CE) n.º 852/2004 & DGAV:** requisitos de higiene alimentar, registo/licenciamento de estabelecimento ou cozinha e princípios HACCP.
  - **Autoridade Tributária / Portal das Finanças:** obrigatoriedade de início de atividade (CAE adequado), emissão de faturas e referência ao regime de isenção de IVA (Art. 53.º) dentro dos limites legais vigentes.
  - **Panificação Técnica em Portugal:** classificação por cinzas (Farinha T55, T65) vs força glútica ($\text{W}$), necessidade de farinha de força elevada ($\text{W} \ge 350\text{--}400$ / Tipo 00 Forte / Manitoba) para massas ricas de panetone, e equivalência entre fermento de padeiro fresco (cubos 25g) e seco (~1:3).

## 2. Pressupostos Assumidos
1. O público-alvo reside em **Portugal** (PT-PT, moeda EUR, pagamentos típicos MB WAY / Multibanco / transferência, forno doméstico padrão europeu em °C e gramas).
2. Os clientes começam em **pequena escala doméstica ou artesanal** e precisam de orientação prática antes de investir em stocks elevados (daí o Método Encomenda Primeiro).
3. A aplicação web (`app/`) funcionará inicialmente de forma autónoma com persistência local (`localStorage` + exportação/importação de cópia de segurança em JSON), sem exigir base de dados paga ou backend complexo para o comprador usar imediatamente.
4. O entregável de teste existente em Downloads (`panetones_que_rendem_entregavel_teste_hotmart.pdf`) confirma que a Hotmart espera um pacote final estruturado e legível em telemóvel e computador, substituindo aquele PDF provisório.

## 3. Limitações e Salvaguardas Obrigatórias
- **Sem receitas "testadas e validadas em estúdio":** como agente de desenvolvimento digital, as formulações técnicas serão fundamentadas em proporções clássicas e credíveis de panificação artesanal, **mas nunca serão apresentadas como receitas testadas na nossa cozinha**; incluiremos sempre indicação explícita para o produtor realizar um teste prévio de forno/fermentação antes de aceitar encomendas.
- **Sem preços reais dinâmicos de supermercados/fornecedores:** preços de ingredientes flutuam por região, marca e época; no Bónus 03 e na Calculadora usaremos exemplos ilustrativos claramente marcados como *"Exemplo ilustrativo — substitua pelos seus custos reais"*.
- **Sem garantia de vendas, lucros ou aconselhamento jurídico/fiscal vinculativo:** todo o conteúdo respeitará os disclaimers legais presentes no rodapé da landing page (`index.html`).
- **Personagem Inês Martins:** tratada exclusivamente como personagem ilustrativa da marca, nunca como autora real ou especialista certificada.

