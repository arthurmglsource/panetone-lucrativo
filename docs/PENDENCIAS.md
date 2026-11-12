# Pendências Reais e Dependências Externas — Panetones que Rendem

Tudo o que podia ser construído, validado, empacotado e testado digitalmente no código e nos documentos foi concluído. Os pontos abaixo dependem exclusivamente de **credenciais externas do proprietário** ou **validação física na cozinha/contabilidade**.

---

## 1. Infraestrutura, Credenciais e Publicação Remota (Exige Titular das Contas)

1. **Deploy do Projeto Independente na Vercel (`app/`):**
   - Não existe sessão autenticada na Vercel neste ambiente (`vercel` CLI ausente e plugin MCP Vercel `Unauthorized`).
   - **Ação necessária:** criar um projeto Vercel novo ligado ao repositório GitHub apontando **Root Directory = `app`** (sem alterar o projeto `prj_VZZzAKnLM5iFp5wNU7wvsIVL9WJI` da landing page).
2. **Variáveis de Ambiente e Base KV (Vercel `app/`):**
   - Definir `SESSION_SECRET`, `HOTMART_HOTTOK`, `KV_REST_API_URL` e `KV_REST_API_TOKEN` (Upstash Redis / Vercel KV).
   - Caso queira um ambiente **Preview** separado para QA sem login de comprador, ativar `ALLOW_PREVIEW_MODE=true` **apenas em Preview** (servirá apenas o `demo-content.json` com 2 receitas e downloads bloqueados).
3. **Configuração na Área de Membros e Webhook Hotmart:**
   - Carregar os ficheiros de `entrega-hotmart/Pacote-Organizado-Hotmart/` (ou o ficheiro único `Pacote-Completo-Panetones-que-Rendem.zip` de `21.72 MB`) no *Hotmart Club*.
   - Inserir o URL real da App Vercel na Aula 01 após o deploy.
   - Registar o Webhook v2.0.0 (`https://<dominio-app>.vercel.app/api/webhook/hotmart`) com eventos `PURCHASE_APPROVED`, `PURCHASE_COMPLETE`, `PURCHASE_REFUNDED`, `PURCHASE_CANCELED`, `PURCHASE_CHARGEBACK`.
4. **Preenchimento dos Dados Comerciais na Landing Page (rodapé existente):**
   - Os textos *"Dados do vendedor e contacto de apoio: por disponibilizar"* na landing page original (`index.html`) aguardam os dados jurídicos/email do produtor antes do tráfego pago final (não modificados por respeito à regra de preservação da landing page).

---

## 2. Validação Física e Legal em Portugal (Obrigatória Antes da Venda ao Público)

1. **Testes físicos de cozinha das 30 receitas:**
   - Este projeto foi desenvolvido integralmente em ambiente digital; as receitas são formulações técnicas orientativas e **não foram testadas fisicamente em forno neste ambiente**.
   - **Antes de comercializar:** testar forno real (temperatura interna `92 °C–94 °C`), absorção da marca de farinha escolhida, ponto de batimento de cremes e estabilidade/prazo de validade (`shelf-life`) de `3 a 8 dias` em condições reais.
2. **Enquadramento Fiscal, Sanitário e Municipal (Portugal):**
   - Validar com um **Contabilista Certificado / Portal das Finanças** (início de atividade, CAE e limites reais do Art. 53.º CIVA) e na **Câmara Municipal / DGAV / ASAE** (registo alimentar / SIR Tipo 3 / requisitos de cozinha privada Anexo II Cap. III Reg. 852/2004 e rotulagem obrigatória Reg. UE 1169/2011).
3. **Orçamentação Local Real:**
   - Preencher os preços unitários nos `.csv` (`0,00 €` em branco nos campos de custo) e na Calculadora da App com talões reais locais antes de fechar o menu de venda.
