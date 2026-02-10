# Nova Refactor Plan: Performance & Scalability Pass

Based on the Neural Insights from Seeker, we are entering the second optimization phase for Caribe Digital CR.

## Phase 1: Performance Optimization [FORGE]
- [x] **Batch Database Operations**:
    - [x] Update `ProductsService` to include `findByIds(ids: string[])`.
    - [x] Refactor `OrdersService.create` to fetch all products in one query instead of a loop.
- [ ] **Transaction Hardening**:
    - [ ] Ensure proper isolation levels for stock-sensitive operations.

## Phase 2: Domain Separation (SRP) [NOVA]
- [x] **Extract Services**:
    - [x] Create `OrderFulfillmentService` to handle status transitions.
    - [x] Create `OrderValidator` to handle complex business rules.
- [x] **Auth Hardening**:
    - [x] Extract `TokenService` from `AuthService` to separate concerns.
- [ ] **Address Circular Dependencies**:
    - [ ] Review `auth.module.ts` and `user.entity.ts` imports to decouple where possible.

## Phase 3: Infrastructure & Monitoring [SENTINEL]
- [x] **Real-time Notifications**:
    - [x] Implement WebSocket Gateway (NestJS).
    - [x] Add real-time toast notifications to Merchant Dashboard.
- [ ] **Audit Logs**:
    - [ ] Add explicit swarm telemetry via `AsyncLogger` to core service methods.
    - [ ] Verify `sentinel_caribe.py` can detect performance degradation in order flows.
