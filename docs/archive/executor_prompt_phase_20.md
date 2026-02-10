# 🤖 Prompt for Executor (Forge) - Phase 20

**Contexto**:
Actúas como **Forge**. Yo (Logic Master) he detectado problemas visuales en el mapa interactivo (eventos solapados, animaciones inestables). Vamos a ejecutar la **Fase 20: Visual Map Polish**.

**Objetivo**:
Hacer que el mapa se vea profesional, limpio y performante. Eliminar el efecto "extraño" (jitter, floating markers).

---

## 🛠️ Instrucciones de Implementación

### Tarea 1: Calibración de Marcadores (Frontend)
Edita `frontend/src/components/LiveMap.tsx`.
1.  Busca dónde se crea el `L.divIcon` para los eventos (probablemente en `useEventMarkers` o dentro del renderizado de `LiveMap`).
2.  **CRÍTICO**: Configura explícitamente `iconAnchor` y `popupAnchor`.
    ```typescript
    // Ejemplo de corrección
    iconAnchor: [24, 48], // La mitad del ancho, altura completa (si es un pin)
    // O si es un círculo centrado:
    iconAnchor: [24, 24], // Centro exacto
    ```
    *Asegúrate de que coincida con el tamaño CSS del marcador.*

### Tarea 2: Limpieza CSS
Edita `frontend/src/components/LiveMap.css`.
1.  Busca `.event-billboard` o las clases de los marcadores.
2.  Añade `will-change: transform` para forzar aceleración por hardware.
3.  **Z-Index War**: Asegúrate de que:
    *   Map Tiles: z-index 0
    *   Overlays (Lluvia): z-index 400
    *   **Marcadores**: z-index 600+
    *   Modales/UI: z-index 1000+
    *(Revisa si hay conflictos que hagan que los marcadores se corten).*

### Tarea 3: Clustering (Agrupación)
Si los eventos están muy juntos:
1.  Implementa una lógica simple de "distancia" en `useEventMarkers.ts` o usa `react-leaflet-cluster` si ya está instalado.
2.  Si no quieres añadir dependencias, implementa un filtro: "Si el zoom es < 13, solo muestra eventos destacados (GOLD/SILVER) o agrupa por ciudad".

### Tarea 4: Verificación Visual
*   Asegúrate de que al hacer zoom-in/zoom-out los marcadores no "bailen" (jitter).
*   Verifica que la lluvia (`TropicalParticles`) no tape los clicks en los eventos (`pointer-events: none`).

---

**Nota del Arquitecto**:
La estética es clave. Si se ve mal, el usuario pierde confianza. Prioriza la estabilidad visual sobre las animaciones locas.
