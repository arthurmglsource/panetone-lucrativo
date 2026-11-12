# Panetones que Rendem — Workspace do Produto Digital (Natal 2026)

Workspace editorial, técnico e de QA do produto digital **Panetones que Rendem** (mercado português, valores em EUR, PT-PT).

## Estrutura do Diretório
- `00-auditoria/` — Auditoria da landing page e materiais visuais, matriz de promessas, arquitetura editorial/app, requisitos, plano de execução, fontes, pressupostos e limitações.
- `01-ebook-principal/` — Conteúdo editorial do Guia Principal (6 módulos + 30 fichas de receitas + catálogo + plano de vendas + calendário de produção).
- `02-kit-divulgacao/` — Kit Vende Sozinho (templates visuais, modelos de catálogo e textos prontos para WhatsApp/redes sociais).
- `03-etiquetas/` — Etiquetas de marca própria personalizáveis (cinta, selo, tags e autocolantes com campos de rotulagem PT/UE).
- `04-bonus-lista-compras/` — Bónus 01: Lista de Compras Organizada (10, 30 e 50 unidades).
- `05-bonus-caderno-encomendas/` — Bónus 02: Caderno de Encomendas (clientes, pedidos, sinais e entregas).
- `06-bonus-guia-fornecedores/` — Bónus 03: Guia de Fornecedores e Compras em Portugal.
- `07-pesquisa-fontes/` — Pesquisa documental e técnica (ASAE, DGAV, Portal das Finanças, Regulamento UE 1169/2011, panificação PT).
- `08-qa/` — Checklists, validações ortográficas PT-PT, testes funcionais e relatórios de QA.

## Relação com `produto-digital/` e `app/`
- **`panetones-que-rendem/`**: fonte editorial, pesquisa, matrizes, textos-mestre e QA.
- **`produto-digital/`**: artefactos finais compilados para distribuição (e-books PDF, bónus, kit e etiquetas imprimíveis).
- **`app/`**: aplicação web independente (Área do Cliente + Calculadora de Lucro + Encomendas + Lista de Compras + Calendário + Gerador de Etiquetas + Biblioteca), preparada para projeto Vercel autónomo.

## Ficheiros de Controlo
- Ver estado atual em [`PROGRESS.md`](./PROGRESS.md)
- Ver instruções de continuidade em [`HANDOFF.md`](./HANDOFF.md)
