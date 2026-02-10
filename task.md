# Tasks: Caribe Digital CR Swarm Integration

- [x] Initial Knowledge Acquisition [RESEARCHER]
    - [x] Generate Context Map (`.context_map.json`)
    - [x] Build Dependency Graph (`.dependency_graph.json`)
    - [x] Run Neural Architectural Analysis
- [x] Infrastructure Hardening [ARCHITECT]
    - [x] Implement `sentinel_caribe.py` for this project
    - [x] Consolidate fragmented documentation into `/docs`
- [/] Optimization Pass [DEVELOPER]
    - [x] Break Entity Circular Dependencies (Enums extraction)
    - [x] Refactor `AuthService` into SRP modules (`TokenService`)
    - [x] Identify slow database queries or API endpoints (Optimized OrdersService)
    - [x] Suggest frontend bundle optimizations (Vite manualChunks)

- [x] Implementation Pass: Order System [DEVELOPER]
    - [x] Create Order/OrderItem Entities & Enums
    - [x] Implement Transactional Order Service
    - [x] Build Cart Sidebar with Checkout Logic
    - [x] Verify Full Order Flow (End-to-End)

- [x] Implementation Pass: Merchant Dashboard [NOVA]
    - [x] Link Merchants to Users (DB & Entity)
    - [x] Implement Merchant-Only Order Management Endpoints
    - [x] Build Glassmorphic Merchant Dashboard UI
    - [x] Implement Dynamic Order Status Flow (Patch logic)
    - [x] Implement Real-time Order Notifications (WebSockets/Socket.io)

- [x] Implementation Pass: Logistics & Delivery [NOVA]
    - [x] Update `Order` entity with courier tracking
    - [x] Implement "Claim Order" logic for couriers
    - [x] Build "Courier Central" Dashboard UI
    - [x] Implement real-time broadcast to Delivery Pool when orders are READY

- [x] Implementation Pass: Communication & Messaging [NOVA]
    - [x] Create `Message` entity & DB migration logic
    - [x] Implement real-time Order Chat Gateway (WebSockets)
    - [x] Build premium "Order Chat" UI component
    - [x] Integrate Chat across Client, Merchant, and Courier Dashboards

- [x] Implementation Pass: Logistics & Intelligence [NOVA]
    - [x] Implement live Courier Tracking via WebSockets
    - [x] Create Advanced Filters (Rating, Distance, Name)
    - [x] Build premium map-tracking UI for Clients
    - [x] Integrate Geolocation for "Closest" merchant discovery

- [x] Execute System Launch Scripts [USER REQUEST]
    - [x] Validated `START_ALL.ps1`, `START_BACKEND.ps1`, `START_FRONTEND.ps1`
    - [x] Executed `START_ALL.ps1` in external PowerShell process

- [x] Phase 18: Logic Verification & System Hardening [LOGIC MASTER]
    - [x] Fix Map Race Conditions (AbortController)
    - [x] Implement Strict GeoJSON Typing
    - [x] Repair Mission Marker Animation Loop
    - [x] Memoize Clustering & Filtering Logic
    - [x] Harden Mission Persistence Logic
