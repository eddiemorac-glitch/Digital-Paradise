# Optimization & Improvement Plan 2.0 🚀

Puntos de mejora detectados tras el escaneo exhaustivo del sistema.

## Backend (Performance & Security)
1.  **[DONE] Caching Layer:** Implementado `CacheModule` global y cacheado en `MerchantsService.findAll`.
2.  **[DONE] JWT Refresh Tokens:** Implementado en `TokenService`, `AuthService` y `AuthController`. Interceptor de Axios añadido en el frontend.
3.  **[DONE] Transactions:** Implementado `QueryRunner` y bloqueos pesimistas en `OrderFulfillmentService.claimOrder`.
4.  **[DONE] Health Check API:** Endpoint `/health` creado para monitoreo básico de salud del sistema.

## Frontend (UX & Logic)
1.  **[UX] Skeleton Loaders:** Reemplazar los `Loader2` genéricos por Skeleton Loaders que sigan la forma de las `MerchantCard` para una sensación de carga más fluida.
2.  **[DONE] Dynamic Maps:** Integrado componente `LiveMap` con Leaflet para tracking real de pedidos.
3.  **[DONE] TanStack Query Optimization:** Configurado `staleTime` global (5 min) en `main.tsx`.
4.  **[AESTHETIC] Micro-interacciones:** Añadir sonidos sutiles (pop/click) para acciones críticas como "Confirmar Pedido" o "Repartidor en camino".

## Infraestructura / DX
1.  **[DONE] Advanced Seeding:** `SeedService` refactorizado con más datos reales y soporte para logos/banners.
2.  **[DONE] CI/CD Validation Scripts:** `test_flow.js` integrado en `package.json` y `pre-commit` hook (Husky).
