# Implementation Plan - Phase 1: The Fortress (Admin & Auth)

## Goal Description
Establish the "God Mode" Administrative capability and harden the Authentication system to be production-ready. This involves rigorous Role-Based Access Control (RBAC) and the initial Admin Dashboard backend/frontend.

## User Review Required
> [!IMPORTANT]
> **Admin Access**: I will generate an initial "Super Admin" seed script. The default credentials will be logged to the console on first run. You must change these immediately.
> **Database**: This change might require running a migration if we modify the User entity (currently not planned, just logic changes).

## Proposed Changes

### Backend (NestJS)

#### [NEW] `src/modules/admin`
-   **AdminModule**: New domain for administrative logic.
-   **AdminController**: Endpoints for `/admin/stats` (users count, orders count) and `/admin/users` (ban/unban).
-   **AdminService**: Logic to aggregate data from other modules.

#### [MODIFY] `src/modules/users`
-   **User Entity**: Add `agreedToPrivacyPolicy` (bool), `privacyPolicyAgreedAt` (Date), and `privacyPolicyVersion` (string) for Ley 8968 Compliance.

#### [MODIFY] `src/modules/auth`
-   **RolesGuard**: Implement the guard to strictly enforce `@Roles('ADMIN')`.
-   **JwtStrategy**: Ensure it rejects inactive users (`isActive: false`).
-   **RegisterDto**: Add `agreedToPrivacyPolicy` validation (must be true) and `privacyPolicyVersion`.

#### [NEW] `src/modules/admin` (AdminJS Integration)
-   **AdminJS**: Install and configure `@adminjs/nestjs` with TypeORM.
-   **Resources**: Register `User`, `Merchant` resources in AdminJS.
-   **Auth**: Secure the Admin panel using existing `AuthModule`.

### Frontend (Vite/React)

#### [UPGRADE] React 19
-   **Dependencies**: Bump `react`, `react-dom` to v19.
-   **Optimization**: Remove unnecessary `useMemo` calls.

#### [MODIFY] `src/api`
-   None. Admin panel is now server-side (AdminJS).

## Verification Plan

### Automated Tests
-   **Backend**: `npm run test:e2e` (I will add a test case for Admin endpoint security).
-   **Command**: `curl -X GET http://localhost:3000/admin/stats -H "Authorization: Bearer <USER_TOKEN>"` -> Should return 403 Forbidden.

### Manual Verification
1.  **Login as Admin**: Use the seeded credentials.
2.  **Access Dashboard**: Go to `/admin`. Verifying the "Command Center" UI loads.
3.  **Login as User**: Try to access `/admin`. Verify redirection to `/`.
