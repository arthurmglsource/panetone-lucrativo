# Relatório Completo de Auditoria e QA — Panetones que Rendem (Natal 2026)

**Data:** 2026-11-12  
**Branch:** `dev/produto-digital`  
**Princípio de veracidade:** Este relatório regista exclusivamente verificações, ficheiros e resultados realmente observados após as últimas alterações aplicadas. Testes físicos de cozinha e operações que exigem credenciais externas constam separadamente em [PENDENCIAS.md](file:///Users/arthurmagalhaes/.gemini/antigravity/scratch/panetone-lucrativo/docs/PENDENCIAS.md).

---

## 1. Fase 1 — Auditoria Final de Conteúdo, Ficheiros e PT-PT

1. **Coerência Landing Page (`index.html`) ↔ Entregáveis (`produto-digital/` & `app/`):**
   - Verificados os `6` módulos, `30` receitas em 5 blocos, `3` bónus PDF (`Lista 10/30/50`, `Caderno de Encomendas`, `Guia de Fornecedores PT`), Kit de Divulgação (PNGs + PDFs + scripts + HTML), Etiquetas A4, Calculadora CSV, Calendário CSV e Aplicação PWA.
   - Verificado que `index.html`, folhas de estilo públicas, `script.js`, `promotion.js`, `assets/` e `.vercel/` na raiz permanecem com `0` alterações face a `main`.
2. **Integridade Técnica de Todos os 24 Entregáveis + ZIP Hotmart:**
   - **11 PDFs:** Todos verificados com assinatura `%PDF-`, terminador `%%EOF` e tamanhos não nulos (`832.0 KB` até `6.63 MB`).
   - **3 PNGs:** Verificados com assinatura PNG válida (`2160×3840`, `2380×3368`, `2160×2160`).
   - **4 HTMLs editáveis:** Verificados sem ligações locais quebradas (`missing_local=[]`).
   - **5 CSVs editáveis:** Verificadas colunas uniformes em todas as linhas e fórmulas compatíveis (`=IF(...)`, `=SUMIF(...)`, `=SUM(...)`). **Correção aplicada nesta auditoria:** adicionado **UTF-8 BOM (`\xef\xbb\xbf`)** aos 5 CSVs para garantir abertura sem erros de acentuação em Excel PT-PT.
   - **Pacote ZIP Hotmart (`Pacote-Completo-Panetones-que-Rendem.zip`):** `21.72 MB`, `25` ficheiros empacotados e testado com `unzip -tq` (`0` erros).
3. **Revisão Linguística PT-PT & Parsing de Conteúdos (`sync-content.mjs`):**
   - Scan automatizado across `.md`, `.html`, `.csv`, `.ts`, `.tsx`, `.mjs` confirmou ausência de termos PT-BR como `você`, `xícara`, `geladeira`, `celular`, `planilha`, `cardápio`, `pix` ou `R$`.
   - **Correção aplicada nesta auditoria:** corrigido o parser de `sync-content.mjs` que deixava `commonErrors` vazio na Receita 01 (`Erros mais frequentes:` vs. `Erros comuns:`) e adicionados os 5 entregáveis em falta (`calendario-producao-entregas-editavel.csv`, `card-whatsapp-abertura.{pdf,html}`, `post-feed-sabores.{pdf,html}`) elevando de `19` para **`24` downloads protegidos**.
   - Validado que `content.json` contém `30` receitas com `0` ingredientes, `0` passos e `0` erros vazios.

---

## 2. Fase 2 — Testes da Aplicação Web (`app/`), Segurança e Demo QA

### A. Testes Unitários e de Segurança (`npm test`)
- **Comando:** `npx vitest run` (`2` ficheiros, **`9/9` testes aprovados**):
  - `src/utils/calculations.test.ts` (`5` testes): escalonamento proporcional, agregação automática da lista de compras com reserva de embalagens e cálculo completo da Calculadora em euros.
  - `server/authCore.test.ts` (`4` testes): assinatura HMAC-SHA256 de cookies, verificação de expiração, rejeição de tokens adulterados e comparação timing-safe.

### B. Build e Auditoria de Exposição de Conteúdo (`npm run build`)
- **`npm run sync`:** gerados `content.json` (`30` receitas, `6` módulos, `17` fornecedores, `19` scripts, `24` ficheiros protegidos) e `demo-content.json` (`isDemoMode: true`, `2` receitas de amostra, `1` módulo amostra, `0` descargas).
- **`tsc -b && vite build`:** concluído sem erros (`dist/assets/index-CjR_UioJ.js` com `349.67 kB` / `102.30 kB` gzip).
- **Auditoria do bundle público:** `grep` em `dist/` devolveu **`0` ocorrências** de receitas pagas.

### C. Testes End-to-End em Chrome Headless CDP (Mobile `390×844` + Desktop `1280×840`)
Executado fluxo completo automatizado contra servidor local com código de comprador de teste temporário (`BUYER_MASTER_CODE=QA-TEST-CODE-2026`):

1. **Segurança e Modo Demonstração QA (`preview`):**
   - Login em Demonstração QA exibiu banner claro `"Versão de Demonstração QA ativa"`, limitou `/api/content` a **`2` receitas** de amostra (`demo-content.json`) e bloqueou `/api/download` com **`HTTP 403 Forbidden`**.
   - **Correção aplicada nesta fase:** ao terminar sessão (`handleLogout` em `App.tsx`), o estado agora limpa o separador ativo regressando corretamente a `Início` (`setTab('home')`).
2. **Sessão de Comprador & Fluxo Mobile (`390×844`):**
   - Login de comprador desbloqueou todas as **`30` receitas**; `Home` exibiu KPIs reais em `0,00 €` e **`0` overflow horizontal**.
   - **Pesquisa & Favoritos:** pesquisa `"pistácio"` filtrou para `1` receita; alternar favorita atualizou `Favoritas (3) -> Favoritas (2)` e persistiu após `Page.reload()`.
   - **Escalonamento & Modo Cozinha:** Receita 01 escalada para `6` unidades apresentou `1,50 kg` no DOM; `Timer 5 min` iniciou contagem e o botão `Minimizar temporizadores` ativou `.floating-timers--minimized`.
   - **Calculadora (€):** cálculo atualizado e cenário `"Cenário QA Pistácio"` guardado com sucesso.
   - **Encomendas (exemplos de teste explicitamente marcados):** criação de `"Beatriz Almeida (Teste QA)"`, marcação de sinal de `50 %` (`Confirmada (Sinal OK)`) e persistência confirmada após `Page.reload()`.
   - **Lista de Compras & Calendário:** geração automática a partir da encomenda incluiu `Leite condensado` e `Formas de papel`; `Calendário` apresentou a entrega e guardou nova tarefa `"Calibrar forno lote QA"`.
3. **Fluxo Desktop (`1280×840`) & Downloads Protegidos:**
   - Zero overflow horizontal no `Catálogo`, botão `Exportar Imagem PNG` acionado sem exceções JavaScript e aba `Bónus` renderizou os **`24` links protegidos**.
   - Descarga real verificada de `01-ebook-completo-panetones-que-rendem.pdf` (`HTTP 200`, `%PDF-`) e `lista-compras-editavel-10-30-50.csv` (`HTTP 200`, BOM UTF-8 `\xef\xbb\xbf` confirmado).
   - Zero erros inesperados de runtime JS.

---

## 3. Estado da Publicação Vercel

- **Vercel CLI (`vercel`):** não instalado no ambiente (`command not found`).
- **Vercel MCP (`list_projects`) / Contas Conectadas:** devolveu `Unauthorized` / nenhuma conta ligada ao plugin.
- **Resultado:** O deploy de pré-visualização remoto não pôde ser executado por falta de credenciais Vercel ativas neste ambiente e encontra-se documentado em [PENDENCIAS.md](file:///Users/arthurmagalhaes/.gemini/antigravity/scratch/panetone-lucrativo/docs/PENDENCIAS.md).
