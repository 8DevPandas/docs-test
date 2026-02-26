# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Operational playbook for **Tandem Digital**, a software development agency specializing in healthcare and government sector projects. Defines standardized processes for managing multiple parallel development projects using Jira, GitHub, Slack, and Notion.

## Document Architecture

Documents follow a numbered sequence with intentional cross-references:

| # | File | Role |
|---|------|------|
| 01 | `01-marco-general.md` | Foundation: tools, roles, project types, capacity planning |
| 02 | `02-flujo-proyecto-desarrollo.md` | Core Scrum workflow (requirements through delivery) |
| 03 | `03-gestion-cambios-alcance.md` | Scope change classification (A-D) during sprints |
| 04 | `04-bugs-produccion.md` | Production bug handling (P0-P3 priority) |
| 05 | `05-spikes-investigacion.md` | Research/investigation tasks for uncertainty |
| 06 | `06-tareas-tecnicas.md` | Technical debt, refactoring, non-visible work |
| 07 | `07-plantillas-jira.md` | Jira template selection guide |

### Key cross-document relationships

- Bug P0 (doc 04) = urgency D1 (doc 03) — sprint interruption rules apply
- Spike results (doc 05) can trigger scope changes (doc 03)
- Post-mortem actions (doc 04) generate technical tasks (doc 06)
- Urgent technical tasks (doc 06) follow urgency classification from doc 03
- `README.md` contains the master index with a Mermaid relationship diagram

## Writing Guidelines

- **Language**: All content in Spanish. Maintain consistent terminology across documents.
- **Headings**: H1 for document title, H2 for major sections, numbered sections where applicable.
- **Tables**: Use for structured classifications (bug priorities, scope changes, capacity distribution, Jira labels).
- **Mermaid diagrams**: Used extensively (flowcharts, state diagrams, sequence diagrams, git graphs, quadrant charts, mind maps). Preserve existing diagram styles when editing.
- **Navigation**: Every document starts with `> [Volver al indice](README.md)` and ends with a "Documentos relacionados" table.
- **Examples**: Include concrete examples from healthcare/government domain (appointments, patient records, billing, compliance).
- **Pending items**: Mark incomplete sections with "(pendiente)".
- **Cross-references**: Use relative links like `[Bugs en Produccion](04-bugs-produccion.md)`. When updating one document, verify consistency in documents that reference it.

## Key Domain Concepts

### Project lifecycle
Desarrollo (Scrum) -> Evolucion (Kanban) -> Mantenimiento (Kanban simplificado). Can reactivate backwards.

### Sprint capacity split
- 75-80% planned work (features + technical tasks when applicable)
- 20-25% urgency reserve
- Technical tasks have no fixed capacity reservation; in Desarrollo projects it's good practice to include them, in Evolucion/Mantenimiento they come from the backlog as needed

### Classification systems
- **Scope changes**: A (minor clarification) / B (small change) / C (large change) / D1-D3 (urgencies)
- **Production bugs**: P0 (critical) / P1 (grave) / P2 (minor) / P3 (cosmetic)
- **Technical tasks**: A (minor, integrated) / B (plannable) / C (urgent)

### Jira labels and types used across documents
- **Labels**: `production-bug`, `hotfix`, `cambio-alcance`, `urgencia-critica`, `urgencia-compromiso`, `urgencia-operativa`, `spike`
- **Task type**: `Tech Task` for all non-visible technical tasks (no specific labels needed)

### Git branching strategy
- `feature/PROJ-XXX`: from `desarrollo`, merge to `desarrollo`
- `bugfix/PROJ-XXX`: from `desarrollo`, merge to `desarrollo` (P1-P3 bugs)
- `hotfix/PROJ-XXX`: from `main`, merge to `main` + `desarrollo` (P0 bugs only)

## When Adding New Documents

1. Use the next number in sequence (e.g., `08-nuevo-documento.md`)
2. Add navigation header linking to `README.md`
3. Add "Documentos relacionados" table at the end
4. Update `README.md` index tables and the Mermaid relationship diagram
5. Update cross-references in any existing documents that relate to the new content
