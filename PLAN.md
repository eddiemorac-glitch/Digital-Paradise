# Implementation Plan: Order System & Checkout

This plan focuses on enabling the actual "business" of Caribe Digital: placing orders.

## Phase 1: Backend Architecture & Implementation [DEV]
- [x] **Data Modeling**:
    - Create `Order` entity (relations: User, Merchant, OrderItems).
    - Create `OrderItem` entity (relations: Order, Product).
    - Define `OrderStatus` enum (`PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `DELIVERED`, `CANCELLED`).
- [x] **DTOs**: Define `CreateOrderDto` to validate incoming JSON.
- [x] **Service Logic**:
    - Implement `create()` with `@Transaction()` to ensure data integrity.
    - Validate total price calculation on backend (security).
- [x] **API Endpoints**:
    - `POST /orders`: Create new order.
    - `GET /orders/mine`: Get current user history.

## Phase 2: Frontend Checkout Experience [DEV]
- [x] **API Client**: Create `src/api/orders.ts`.
- [x] **UI Components**:
    - Enhance `CartSidebar` to handle the "Checkout" state.
    - Add a simple "Order Confirmation" modal/view.
- [x] **State Management**:
    - Clear `CartStore` upon successful order.
    - Show "Success" animation.

## Phase 3: Quality Assurance [QA]
- [x] **Functional Test**: User logs in -> Adds items -> Places Order -> Checks Database.
- [x] **Edge Cases**: Empty cart, invalid token, product out of stock (basic check).
