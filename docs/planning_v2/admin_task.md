# Tasks: Phase 1 & 2 (Auth Hardening & Admin)

- [/] **Phase 1: The Fortress (Auth Security)**
    - [ ] Create `RolesGuard` (src/modules/auth/guards/roles.guard.ts).
    - [ ] Update `JwtStrategy` to check `user.isActive`.
    - [ ] Create `ActionsGuard` (Optional, for specific permissions).

- [ ] **Phase 2: God Mode (Admin Dashboard)**
    - [ ] **Backend**
        - [ ] Generate `AdminModule`.
        - [ ] Create `AdminController` (Stats, Users).
        - [ ] Implement `AdminService` (Aggregation logic).
    - [ ] **Frontend**
        - [ ] Create `AdminLayout` (Command Center UI).
        - [ ] Implement `AdminDashboard` page.
        - [ ] Add Protected Routes in `App.tsx`.
