# 📐 Contributing to Caribe Digital CR

## 🛡️ Engineering Standards
All development must adhere to the **Sentinel-7** engineering standards to maintain high visibility for autonomous agents.

### 1. TypeScript Strictness
- `any` is strictly prohibited unless explicitly allowed in `<exception_registry>`.
- Use interfaces over types for public-facing contracts.
- Explicitly define return types for all service methods.

### 2. State Management
- **Frontend**: Prefer Zustand (`useCartStore`, `useMapStore`).
- **Backend**: Strict domain separation via NestJS Modules.

### 3. Anti-Pattern Registry (Do NOT Repeat)
- **AP_001**: Leaflet re-initialization without cleanup.
- **AP_002**: Raw SQL queries in service layer (use TypeORM).
- **AP_003**: Hardcoding environment variables in components.

## 🏗️ Directory Ethics
- `/api`: Global API clients only.
- `/features`: Domain-specific components (Map, Auth).
- `/infrastructure`: Only configuration and environment files.

## 🧪 Verification Protocol (TDT)
Before submitting changes, ensure:
1. `npm run test` passes.
2. Manual verification recorded in `walkthrough_phase_X.md`.
3. All socket events trigger the correct UI invalidations.
