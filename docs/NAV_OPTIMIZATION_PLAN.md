# Plan de Optimización de Navegación: Migración a React Router v6

## 1. Objetivo
Transformar la navegación actual basada en estados condicionales en `App.tsx` a un sistema de enrutamiento formal. Esto permitirá:
- Funcionamiento correcto del botón "Atrás" del navegador.
- URLs compartibles (ej: `/mapa`, `/eventos`).
- Mejor organización del código (sacar lógica de `App.tsx`).
- Soporte para carga perezosa (Lazy Loading) por ruta.

## 2. Cambios Estructurales
- **Nuevas Carpetas**: `src/pages` y `src/layouts`.
- **Layout Principal**: `RootLayout.tsx` (contendrá Navbar, Footer y Modales Globales).
- **Páginas**: 
  - `Home.tsx` (Grilla de comercios, Hero).
  - `AdminPage.tsx` (Dashboard de Admin).
  - `MerchantPage.tsx` (Productos de un comercio específico).
  - `ProfilePage.tsx` (Perfil de usuario).
  - etc.

## 3. Pasos de Ejecución

### Fase 1: Preparación
1. Crear directorios `src/pages` y `src/layouts`.
2. Definir el `RootLayout.tsx` extrayendo el Navbar y Footer de `App.tsx`.

### Fase 2: Fragmentación de App.tsx
1. Mover la lógica de búsqueda y filtrado a `src/pages/Home.tsx`.
2. Crear componentes de página para cada sección mayor.

### Fase 3: Configuración del Router
1. Instalar/Verificar `react-router-dom`.
2. Configurar `createBrowserRouter` en un nuevo archivo `src/router.tsx`.
3. Actualizar `main.tsx` para usar el `RouterProvider`.

### Fase 4: Limpieza
1. Eliminar los estados de navegación manual (`showMap`, `showEvents`, etc.) de la tienda de estado o de `App.tsx`.
2. Usar el hook `useNavigate` para las transiciones.

## 4. Verificación
- Navegar entre secciones y verificar que la URL cambie.
- El botón de "atrás" debe funcionar sin cerrar la aplicación.
- Cargar directamente una URL (ej: `/map`) debe mostrar la vista correcta.
