# 🎨 FRONTEND REBIRTH: Caribe Digital CR (v2.0)

## 💎 Visión Aesthetica: "Tropical Luxury & High-Tech"
No vamos a hacer una web genérica. Vamos a crear una experiencia visual que grite **Caribe Digital**.
-   **Paleta**: Fondos Oscuros Profundos (Glassmorphism), acentos en Verde Neón (Tropical), y gradientes degradados en Naranja Atardecer.
-   **UX**: Micro-animaciones para cada interacción, transiciones de página fluidas y un diseño "Mobile First" extremadamente pulido.
-   **Performance**: Carga instantánea con Vite y optimización de assets.

## 🏗️ Arquitectura del Enjambre (Frontend)
Para evitar la "saturación de información" y el código espagueti de la v1, implementaremos:

### 1. **Atomic Design Strategy**
-   **Atoms**: Botones, inputs, tipografía (Custom Design Tokens).
-   **Molecules**: Cards de Merchants, Inputs de búsqueda con auto-completado.
-   **Organisms**: Navbar cristalino, Listados geográficos, Mapas interactivos.

### 2. **State Management & Data Layer**
-   **React Query (TanStack)**: Para sincronización con el nuevo Backend v2.0 (Caché inteligente).
-   **Zustand**: Para un estado global ligero (Carrito, sesión del usuario, preferencias).

### 3. **Geolocalización Real-Time**
-   Integración con Mapbox o Leaflet para visualizar los Merchants cercanos detectados por el backend.

---

## 📋 Fases de Ejecución

### **Fase 1: Framework & Design System (Ahora)**
- [ ] Inicializar Vite + React + TS.
- [ ] Configurar el sistema de temas y variables CSS (Aesthetics Engine).
- [ ] Implementar el Layout Maestro (Premium Shell).

### **Fase 2: Auth Flow (v2.0 Compatible)**
- [ ] Pantallas de Login y Registro con validaciones dinámicas.
- [ ] Interceptores de JWT para el nuevo AuthService (Argon2).

### **Fase 3: Core Experience (Merchants & Maps)**
- [ ] Feed de negocios con filtros por categoría.
- [ ] Buscador geográfico integrado con el GPS del usuario.
