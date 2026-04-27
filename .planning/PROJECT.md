# Gerenciador de Torneios EA FC 26

## What This Is

Um sistema offline/local para gerenciamento de torneios de EA FC 26 entre amigos. O sistema permite escolher entre múltiplos formatos de campeonato e utilizar elencos reais do jogo para organizar e acompanhar as competições.

## Core Value

A facilidade e rapidez em configurar um torneio presencial com formatos variados e gestão centralizada de resultados pelo administrador.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Suporte a múltiplos formatos de campeonato (ex: Mata-mata, Fase de Grupos + Mata-mata, Pontos Corridos).
- [ ] Interface para o administrador inserir e atualizar os placares dos jogos.
- [ ] Sistema de seleção de times utilizando os elencos reais do EA FC 26.
- [ ] Geração automática de chaves (brackets) e tabelas de classificação com base nos resultados.

### Out of Scope

- [ ] Inserção de resultados pelos próprios jogadores — explicitamente excluído para manter a centralização no admin e reduzir complexidade no MVP.
- [ ] Matchmaking online ou integração oficial com a EA — o foco é presencial/local, a integração de elencos será feita via base de dados estática ou API de terceiros (como Futbin/SoFIFA).

## Context

O projeto visa resolver a necessidade de organizar torneios locais de fim de semana de forma profissional e automatizada, substituindo papel, caneta ou planilhas complexas. 
O desafio técnico inicial será estruturar a base de dados dos elencos do EA FC 2026 de forma eficiente.

## Constraints

- **Gestão**: Apenas o administrador tem privilégios de escrita para placares.
- **Ambiente**: O foco é uso local (podendo ser uma aplicação web simples ou mobile, mas sem necessidades de concorrência massiva de usuários).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Gestão centralizada | O admin insere os resultados para manter o sistema simples e confiável no MVP. | — Pending |
| Múltiplos Formatos | Essencial para o valor do produto; requer uma arquitetura flexível para gerar as partidas e chaves. | — Pending |

---
*Last updated: 2026-04-27 after initialization*
