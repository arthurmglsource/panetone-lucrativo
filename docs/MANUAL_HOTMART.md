# Manual de Entrega e Configuração na Hotmart — Panetones que Rendem

**Versão:** Natal 2026 (Portugal · €)  
**Regra de segurança:** Este manual descreve exclusivamente a organização da entrega na Área de Membros (*Hotmart Club*) e a ligação segura à Aplicação Web. **Não altera checkout, preços nem produtos ativos** sem autorização expressa do titular da conta Hotmart.

---

## 1. Possibilidades Reais no Hotmart Club (Verificadas na Documentação Oficial Hotmart)

1. **Upload direto de PDFs, ZIP e imagens na Área de Membros:**
   - O *Hotmart Club* aceita anexos diretos até **100 MB por ficheiro** em formatos `.pdf`, `.zip`, `.png`, `.csv`, etc.
   - O nosso pacote integral ([Pacote-Completo-Panetones-que-Rendem.zip](file:///Users/arthurmagalhaes/.gemini/antigravity/scratch/panetone-lucrativo/entrega-hotmart/Pacote-Completo-Panetones-que-Rendem.zip)) pesa **`21.72 MB`**, e o maior PDF individual (`01-ebook-completo-panetones-que-rendem.pdf`) pesa **`6.63 MB`** — todos ficam confortavelmente abaixo do limite de `100 MB` e dispensam links externos em Google Drive ou Dropbox para ficheiros estáticos.
2. **Proteção contra partilha de E-books (DRM Social):**
   - Ao carregar os PDFs na Hotmart, é possível ativar o **DRM Social** (*Ferramentas > Proteção para ebooks*) para estampar automaticamente nome e e-mail do comprador nas páginas descarregadas. *(Nota técnica: teste no próprio painel se o tamanho/formatação do PDF com imagens mantém boa visualização após DRM antes de publicar em massa.)*
3. **Disponibilização da Aplicação Web PWA (`app/`):**
   - O *Hotmart Club* não executa servidores Node/React nem cookies de sessão dentro de armazenamento estático de ficheiros. A forma correta e fiável é publicar a pasta `app/` num **projeto Vercel separado** e colocar na **Aula 01** da Área de Membros:
     - Um botão/link direto para `https://<dominio-app-vercel>.vercel.app/`
     - As instruções simples de login (e-mail da compra + Código da Transação `HP...`) e instalação no ecrã do telemóvel (incluídas em [INSTRUCOES-ACESSO-APP-E-SUPORTE.md](file:///Users/arthurmagalhaes/.gemini/antigravity/scratch/panetone-lucrativo/entrega-hotmart/Pacote-Organizado-Hotmart/01-Comece-Aqui-e-App/INSTRUCOES-ACESSO-APP-E-SUPORTE.md)).

---

## 2. Estrutura Sugerida de Módulos no Hotmart Club

Carregue os ficheiros organizados em `entrega-hotmart/Pacote-Organizado-Hotmart/`:

| Módulo no Hotmart Club | Aula / Secção | Ficheiros a Anexar |
| :--- | :--- | :--- |
| **Módulo 01 — Comece Aqui & Aplicação** | Guia de Arranque + Link da App | `00-comece-aqui-guia-rapido.pdf`, texto/conteúdo de `INSTRUCOES-ACESSO-APP-E-SUPORTE.md` e link externo para a App Vercel + `Pacote-Completo-Panetones-que-Rendem.zip` |
| **Módulo 02 — E-book Principal & 30 Receitas** | Guia Integral e Caderno de Bancada | `01-ebook-completo-panetones-que-rendem.pdf` e `02-caderno-30-fichas-receitas.pdf` |
| **Módulo 03 — Os 3 Bónus Exclusivos** | Bónus 01, 02 e 03 | `bonus-01-lista-compras-10-30-50.pdf`, `bonus-02-caderno-encomendas.pdf`, `bonus-03-guia-fornecedores-portugal.pdf` |
| **Módulo 04 — Kit de Divulgação de Natal** | WhatsApp, Feed e Menu 3 Faixas | `guia-mensagens-whatsapp.pdf`, `catalogo-natal-personalizavel.pdf`, `card-whatsapp-abertura.{pdf,png}`, `post-feed-sabores.{pdf,png}`, `menu-natal-3-produtos.png` |
| **Módulo 05 — Etiquetas & Gestão Legal PT** | Rotulagem ASAE e Custos | `caderno-operacional-custos-calendario-rotulagem.pdf`, `etiquetas-marca-propria-a4.pdf` |
| **Módulo 06 — Modelos Editáveis (CSV/HTML)** | Folhas de Cálculo e Editores Browser | Os 5 `.csv` (UTF-8 com BOM, compatíveis com Excel PT-PT) e os 4 `.html` |

---

## 3. Publicação Segura da App na Vercel + Webhook Hotmart (`X-HOTMART-HOTTOK`)

### Passo A — Criar Projeto Independente na Vercel para `app/`
1. No painel Vercel, crie um **novo projeto** ligado ao mesmo repositório GitHub (`dev/produto-digital` ou branch de produção da App quando desejar), selecionando **Root Directory = `app`**.
2. Em **Settings → Environment Variables** (ambiente **Production**):
   - `SESSION_SECRET`: chave aleatória longa (>= 32 caracteres) para assinar o cookie `pqr_session` (`HttpOnly`, `SameSite=Lax`, `Secure`).
   - `HOTMART_HOTTOK`: Token copiado do painel da Hotmart (secção Webhook).
   - `KV_REST_API_URL` e `KV_REST_API_TOKEN`: credenciais Upstash Redis / Vercel KV conectadas ao projeto da App.
   - *(Opcional)* `BUYER_ACCESS_CODES` / `BUYER_MASTER_CODE`: códigos de contingência/acesso manual enquanto testa ou para suporte VIP.
   - **Não defina `ALLOW_PREVIEW_MODE=true` em Production**, a menos que queira o botão de demonstração limitada visível; use `ALLOW_PREVIEW_MODE=true` apenas no ambiente **Preview** caso pretenda um link de Demonstração QA pública (mesmo assim protegido com apenas `2` receitas e `0` descargas em `demo-content.json`).

### Passo B — Configurar o Webhook 2.0.0 na Hotmart
1. Entre na Hotmart → **Ferramentas → Ver todas → Webhook (API e notificações) → + Cadastrar Webhook**.
2. Versão recomendada: **2.0.0**.
3. URL de envio: `https://<seu-dominio-da-app>.vercel.app/api/webhook/hotmart`.
4. Selecione o produto **Panetones que Rendem** e ative os eventos:
   - `PURCHASE_APPROVED`
   - `PURCHASE_COMPLETE`
   - `PURCHASE_REFUNDED`
   - `PURCHASE_CANCELED`
   - `PURCHASE_CHARGEBACK`
5. Copie o **Hottok** da aba de autenticação para `HOTMART_HOTTOK` na Vercel. A validação compara o cabeçalho `X-HOTMART-HOTTOK` via `crypto.timingSafeEqual` e grava/revoga `pqr:buyer:<email>` no KV automaticamente.

---

## 4. Texto Sugerido para o E-mail Pós-Compra / Boas-Vindas

> **Assunto:** O seu acesso ao Panetones que Rendem — Natal 2026 está pronto!  
> Olá [Nome], obrigada pela sua compra!  
> 1. **Aceda aos seus PDFs, Bónus e Editáveis** entrando na sua Área de Membros Hotmart.  
> 2. **Aceda à Aplicação Web do Produtor** em: `https://<dominio-da-app>.vercel.app/`  
>    - Introduza o **e-mail desta compra** e o **código da transação (`HP...`)** indicado pela Hotmart.  
>    - Siga as instruções na Aula 01 para instalar o ícone no telemóvel (Android/iPhone).  
> Com a Garantia de Satisfação de 15 dias, tem tranquilidade total para explorar todo o material. Boas fornadas!
