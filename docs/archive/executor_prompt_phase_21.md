# 🤖 Prompt for Executor (Forge) - Phase 21: Map Rebirth

**Contexto**:
Actúas como **Forge**. La investigación ha determinado que los problemas visuales se deben a un sistema de clustering manual deficiente y sobrecarga del DOM. Vamos a reescribir la lógica de eventos.

**Objetivo**:
Implementar un sistema de **Taxonomía de Eventos** y **Clustering Profesional**.

---

## 🛠️ Instrucciones de Implementación

### Tarea 0: Preparación
1.  Instala la dependencia de clustering:
    `npm install react-leaflet-cluster leaflet.markercluster`
    `npm install -D @types/leaflet.markercluster`

### Tarea 1: Nueva Taxonomía (Types)
Edita `frontend/src/types/map.ts`.
Añade las interfaces definidas en el Plan:
*   `EventKind`: 'CHARITY' | 'COMMERCIAL' | ...
*   Añade `kind` y `priority` a `EventData`.

### Tarea 2: Componente de Clustering
Crea `frontend/src/components/map/EventClusterGroup.tsx`.
*   Usa el componente `<MarkerClusterGroup>` de la librería instalada.
*   Define una `iconCreateFunction` personalizada:
    *   Debe devolver un `L.DivIcon`.
    *   El HTML debe ser un círculo neón simple con el número de eventos dentro.
    *   Evita animaciones complejas en el cluster para mantener rendimiento.

### Tarea 3: Limpieza Masiva (The Purge)
Edita `frontend/src/hooks/map/useEventMarkers.ts`.
*   **ELIMINA** todo el bloque de lógica manual de clustering (los bucles `for`, `Math.sqrt`, `proximityThreshold`). ¡Sin piedad!
*   Ahora, este hook solo debe encargarse de **filtrar** los eventos visibles y devolver una lista limpia de `EventData`.
*   **NO renderices marcadores directamente aquí**. El hook debe devolver datos, y el componente padre (`LiveMap`) usará `<EventClusterGroup>` para renderizarlos.

### Tarea 4: Integración en LiveMap
Edita `LiveMap.tsx`.
*   Importa tu nuevo `EventClusterGroup`.
*   Envuelve el renderizado de los eventos:
    ```tsx
    <EventClusterGroup>
       {events.map(e => (
           <Marker key={e.id} position={[e.lat, e.lng]} icon={...} />
       ))}
    </EventClusterGroup>
    ```

---

**Nota del Arquitecto**:
Estamos cambiando "fuerza bruta" (cálculos manuales) por "inteligencia" (librería optimizada). El código resultante debe ser mucho más corto y limpio.
