# 🧬 SYSTEM CONTEXT & ARCHITECTURE MEMORY (V6.0)
> **PRIME DIRECTIVE:** Prioritize logic, stability, and clean architecture.

## 1. Project Identity: Caribe Digital CR
- **Mission:** Hyper-local digital ecosystem for Puerto Viejo.
- **Architecture:** Hyper-Cognitive Architecture (HECS) v1.0.
- **Agent Protocol:** `SENTINEL-7` (Autonomous Engineering Mode).

## 2. Core Architecture
- **Frontend (`/frontend`)**: React 18 (Vite), Zustand, TailwindCSS.
- **Backend (`/backend`)**: NestJS, TypeORM, PostgreSQL + PostGIS.
- **Infra (`/infrastructure`)**: Dockerized ecosystem (Redis, RabbitMQ).

## 3. High-Velocity Patterns
- **Real-time Engine:** Centralized `socketService` + TanStack Query invalidation.
- **Map Control:** Manual clustering logic to avoid React 19 conflicts.
- **State Guard:** Standardized "Locked" states for cart/orders during transitions.

## 4. Engineering Guards
- **Cleanup**: All map-based components MUST implement explicit cleanup.
- **Security**: No raw SQL. No exposed API keys in frontend.
- **Documentation**: All new features require an `implementation_plan` and `walkthrough`.

## 5. Directory Structure Navigation
- `/docs`: Archive, Architecture, and Playbooks.
- `/infrastructure`: Deployment and ENV configurations.
- `/scripts`: dev, verification, and migration utilities.
- `/brain`: AI-Agent memory and task tracking.
