# Segurança, Autenticação e Integração Hotmart (`app/`)

## 1. Arquitetura de Proteção de Conteúdo Pago

Para impedir que utilizadores não autenticados acedam às 30 receitas, módulos do método ou PDFs protegidos:

1. **Zero conteúdos pagos no bundle público nem em `app/public/`:**
   - Os dados mestres (`app/protected-data/content.json`) e todos os PDFs/editáveis (`app/protected-downloads/*`) ficam **fora** da pasta `public/` e **não** são importados estaticamente pelo frontend antes da autenticação.
   - O `vercel.json` inclui esses diretórios apenas nas Serverless Functions (`api/**/*.ts`).
2. **Cookie `HttpOnly` assinado por HMAC-SHA256:**
   - `/api/auth/login` valida o comprador no servidor e emite o cookie `pqr_session` (`HttpOnly`, `SameSite=Lax`, `Secure` em produção).
   - `/api/content` e `/api/download?file=...` devolvem `401` sempre que não exista cookie válido.
3. **Zero credenciais Hotmart no frontend (`src/`):**
   - Nenhuma chave (`HOTMART_HOTTOK`, `CLIENT_SECRET`, tokens KV ou `SESSION_SECRET`) usa prefixo `VITE_*`.
   - Toda a verificação ocorre exclusivamente nos ficheiros `app/api/**/*.ts` e `app/server/authCore.ts`.

---

## 2. Variáveis de Ambiente Necessárias na Vercel (Projeto Independente da App)

Ao criar o projeto independente na Vercel apontando o **Root Directory** para `app/`, configure no painel **Settings → Environment Variables**:

| Variável | Obrigatória? | Descrição |
| :--- | :--- | :--- |
| `SESSION_SECRET` | **Sim (Produção)** | String aleatória longa (>= 32 caracteres) usada para assinar cookies `HttpOnly`. Sem ela, logins em produção devolvem `503`. |
| `HOTMART_HOTTOK` | Recomendada | Token de validação do Webhook configurado no painel Hotmart (`X-HOTMART-HOTTOK`), verificado com `crypto.timingSafeEqual` em `/api/webhook/hotmart`. |
| `KV_REST_API_URL` & `KV_REST_API_TOKEN` | Recomendada | Ligação Upstash / Vercel KV para persistir automaticamente compradores aprovados (`PURCHASE_APPROVED` / `PURCHASE_COMPLETE`) e revogar reembolsos (`PURCHASE_REFUNDED` / `PURCHASE_CHARGEBACK`). |
| `BUYER_ACCESS_CODES` / `BUYER_MASTER_CODE` | Alternativa / Arranque | Códigos de acesso válidos para login imediato enquanto o Webhook KV não estiver ligado (ex.: códigos de campanha/lote definidos pelo administrador). |
| `BUYER_EMAILS` | Opcional | Lista separada por vírgulas caso queira restringir códigos a e-mails específicos. |
| `ALLOW_PREVIEW_MODE` | **Não usar em prod pública** | Apenas defina como `true` num ambiente temporário de testes se quiser mostrar o botão *"Pré-visualização Autorizada"*. Em produção real mantenha omitido ou `false`. |

---

## 3. Passos Pendentes para Ligar à Hotmart em Produção

1. No projeto Vercel da aplicação (`app/`), adicione `SESSION_SECRET` e ligue uma base **Upstash Redis / Vercel KV** (`KV_REST_API_URL` e `KV_REST_API_TOKEN`).
2. No painel **Hotmart → Ferramentas → Webhook (API e Notificações)**, registe o URL:
   - `https://<dominio-da-sua-app>.vercel.app/api/webhook/hotmart`
   - Selecione os eventos `PURCHASE_APPROVED`, `PURCHASE_COMPLETE`, `PURCHASE_REFUNDED`, `PURCHASE_CANCELED` e `PURCHASE_CHARGEBACK`.
3. Copie o **Hottok** gerado pela Hotmart para a variável `HOTMART_HOTTOK` na Vercel.
4. No e-mail de boas-vindas pós-compra na Hotmart, instrua o cliente a aceder ao URL da aplicação com o **mesmo e-mail da compra** e o **Código da Transação (`HP...`)**.

