# 🧠 Antigravity Memory Core

> "To keep memory intact, we offload static context to persistent storage."

## 🚧 Critical Constraints (DO NOT FORGET)
1.  **Legal**: User Entity MUST have `agreedToPrivacyPolicy` (Ley 8968).
2.  **Security**:
    -   JWTs must be short-lived.
    -   `JwtStrategy` MUST check `isActive`.
    -   `RolesGuard` MUST be used on all Admin routes.
3.  **Architecture**:
    -   **Vision**: "Modernismo Tropical" (Jungle Green, Deep Ocean, Gold).
    -   **UX**: "Mekatelyu UX" (Microcopy with local flavor: "Everything Bless").
    -   **Frontend**: "Glassmorphism" & "Atomic Design".
    -   **Backend**: "DDD Lite", strict DTOs.
    -   **Tech**: NestJS + PostGIS + Redis + Vite (PWA).

## 📍 Current Focus
-   **Phase**: 1 - The Fortress (Admin & Auth).
-   **Task**: Implementing `RolesGuard` and `AdminModule`.

## 🚫 Anti-Hallucination Rules
-   Do not invent libraries. Use what is in `package.json`.
-   Do not assume File I/O works without paths.
-   Always verify `node_modules` before import.
