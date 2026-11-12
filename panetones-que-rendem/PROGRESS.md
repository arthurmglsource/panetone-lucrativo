# PROGRESS — Panetones que Rendem (Natal 2026)

**Branch ativa:** `dev/produto-digital`  
**Landing Page Produção (`main`):** Intacta (`https://panetone-lucrativo-indol.vercel.app/`)  
**Última atualização:** 2026-11-12

---

## Estado das Fases

| Fase | Descrição | Estado | Observações |
| :--- | :--- | :--- | :--- |
| **Fase 0** | Inspeção de arquitetura e isolamento Git/Vercel | Concluída | Branch `dev/produto-digital` criada; pastas `produto-digital/`, `app/`, `docs/` preparadas. |
| **Fase 1** | **Comando 01:** Auditoria, Matriz, Estrutura, Diretório, Requisitos, Fontes | **Concluída** | Todos os 6 entregáveis criados em `panetones-que-rendem/00-auditoria/` e `07-pesquisa-fontes/`. |
| **Fase 2** | Pesquisa técnica profunda & Redação do Guia Principal + 30 Fichas | **Próxima** | Iniciar redação modular em `01-ebook-principal/`. |
| **Fase 3** | Kit de Divulgação (*Kit Vende Sozinho*) & Etiquetas Marca Própria | Pendente | Templates em `02-kit-divulgacao/` e `03-etiquetas/`. |
| **Fase 4** | Os 3 Bónus & Compilação PDF Final em `produto-digital/` | Pendente | Gerar e inspecionar PDFs finais. |
| **Fase 5** | Aplicação Web Isolada em `app/` (React/Vite/TS + Vercel) | Pendente | Desenvolver e testar todas as ferramentas interativas. |
| **Fase 6** | QA Final (PT-PT, cálculos, responsividade, PDFs) & Entrega | Pendente | Relatórios em `08-qa/`. |

---

## Registo de Decisões Fundamentadas
1. **Preservação absoluta da produção:** toda a produção do produto digital decorre exclusivamente na branch `dev/produto-digital`, mantendo `main` congelada na landing page.
2. **Coerência entre copy e mockup:** o mockup visual promete *30 Receitas*, *Calculadora de Preços/Lucro*, *Plano de Vendas*, *Calendário de Produção*, *Fichas de Receitas*, *Catálogo* e acesso mobile; todos foram incluídos na matriz para entrega dupla (PDF + App).
3. **Veracidade técnica e legal:** as 30 fichas serão apresentadas como formulações técnicas orientativas de panificação (exigindo teste no forno do produtor), e todos os valores financeiros serão sinalizados como exemplos ilustrativos até o utilizador inserir os seus custos reais em euros.
4. **Estrutura dual integrada:** `panetones-que-rendem/` guarda fontes, auditoria, textos-mestre e QA; `produto-digital/` guarda os PDFs/entregáveis finais; `app/` guarda a aplicação web isolada para deploy Vercel próprio.
