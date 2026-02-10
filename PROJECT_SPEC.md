# PROJECT_SPEC: DIGITAL PARADISE

## Overview
DIGITAL PARADISE is a full-stack platform consisting of a NestJS backend and a Vite/React frontend. It is a marketplace and directory for "Merchants" (comerciantes) in the Caribbean region of Costa Rica.

## Tech Stack
- **Backend**: NestJS (Typescript), PostgreSQL (via infrastructure scripts), testing via `.http` files.
- **Frontend**: Vite, React, Typescript.
- **Infrastructure**: PowerShell scripts for database and environment setup.

## Current State
- The project has extensive documentation in Spanish regarding setup and testing.
- Backend is organized with a standard NestJS structure.
- Frontend is a modern TypeScript-based SPA.

## Swarm Intelligence & Nova Protocol
This project is governed by the **Nova Protocol** as defined in `SWARM_ARCHITECTURE_TRAINING.md`. All agents must adopt their specialized identities:
- **Nova (Architect)**: Orchestration and Global Hub signaling.
- **Forge (Developer)**: High-performance implementation using the `swarm.io` module.
- **Sentinel (QA)**: Autonomous healing and integrity checks via `swarm.monitoring`.
- **Seeker (Researcher)**: Neural mapping and documentation via `swarm.intelligence`.

### Swarm Toolbox
- **`swarm.io`**: Used for concurrent I/O and predictive pre-fetching to minimize latency.
- **`swarm.context`**: Maintains the semantic map (`.context_map.json`) and dependency graph.
- **`swarm.monitoring`**: Handles asynchronous logging and system health.
- **`Global Event Bus`**: Connects this project to the Vibe Swarm Hub for cross-project awareness.

## Next High-Level Steps
1.  **Initialize Context**: Run `context_summarizer.py` and `dependency_graph.py` to map the codebase.
2.  **Performance Pass**: Use `io_optimizer.py` for any bulk migrations or refactors.
3.  **Neural Audit**: Execute `neuro_analyzer.py` to refine the architectural roadmap.
