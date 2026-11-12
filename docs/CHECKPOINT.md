# Checkpoint de Desenvolvimento — Panetones que Rendem

## Estado Atual: Checkpoint 00 — Preparação e Isolamento Concluídos
- **Data:** 2026-11-12
- **Branch ativa:** `dev/produto-digital` (ramificada a partir de `main` no commit `16340c8`)
- **Branch `main` (Produção):** Preservada integralmente (`https://panetone-lucrativo-indol.vercel.app/`). Nenhum ficheiro da landing page foi modificado.

## O que já foi preparado
1. Inspeção completa da arquitetura da landing page, tokens visuais (`styles.css`), copy da oferta (`index.html`), assets (`assets/`) e configuração Vercel (`.vercel/project.json`).
2. Criação da branch isolada `dev/produto-digital`.
3. Criação da estrutura independente:
   - `produto-digital/` (`ebooks/`, `bonus/`, `materiais/`)
   - `app/` (com `.gitignore` próprio para dependências, build e `.vercel` independente)
   - `docs/ARQUITETURA.md` e `docs/CHECKPOINT.md`

## Próximo Passo
- **Aguardando o envio do Comando 01 / plano de desenvolvimento** pelo utilizador para iniciar a execução sem suposições.
