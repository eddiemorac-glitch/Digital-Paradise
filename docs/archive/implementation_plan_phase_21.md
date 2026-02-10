# Implementation Plan - Phase 21: Map Logic & Taxonomy Rebirth 🗺️

**Goal**: Complete re-engineering of the Map Event Logic. We are moving from a "flat list of markers" to a **Hierarchical, Clustered, and Level-of-Detail (LOD)** powered system.

## User Review Required
> [!IMPORTANT]
> **Dependency Alert**: You will need to install `react-leaflet-cluster` (or `leaflet.markercluster`).
> 
> **Breaking Change**: The manual grouping logic in `useEventMarkers.ts` will be **deleted**.

## Conceptual Architecture

### 1. New Event Taxonomy
We are introducing a `Taxonomy` system to handle "Beneficenias", "Premium Events", etc.
*   **Tier 1 (Hero)**: "Destacados" / "Gold". Always visible, high Z-Index, rich HTML marker.
*   **Tier 2 (Standard)**: "Community" / "Culture". Clustered at low zoom.
*   **Tier 3 (Background)**: "Points of Interest". Only visible at very high zoom.

### 2. Level-Of-Detail (LOD) Rendering
*   **Zoom < 13**: Show **Regional Clusters** (e.g., "Puerto Viejo: 12 Events").
*   **Zoom 13-15**: Show **Local Clusters** + **Hero Events**.
*   **Zoom > 15**: Show **All Individual Markers**.

## Proposed Changes

### Step 1: Data Modeling [Logic]
#### [MODIFY] [types/map.ts](file:///c:/Users/edmoq/Documents/caribe%20digital%20CR/frontend/src/types/map.ts)
Add the new taxonomy interfaces:
```typescript
export type EventKind = 'CHARITY' | 'COMMERCIAL' | 'COMMUNITY' | 'OFFICIAL';

export interface EventTaxonomy {
    kind: EventKind;
    priority: number; // 0-100
    clusterStrategy: 'NORMAL' | 'ISOLATED'; // 'ISOLATED' events never cluster (e.g. Major Festivals)
}

// Update EventData to include taxonomy
export interface EventData {
    // ... existing fields
    taxonomy?: EventTaxonomy;
}
```

### Step 2: Clustering Engine [Implementation]
#### [NEW] `frontend/src/components/map/ClusterGroup.tsx`
Create a wrapper component using `react-leaflet-cluster`.
*   **Custom Cluster Icon**: Create a function `createClusterCustomIcon`. It should return a `L.DivIcon` that looks like a "Neon Hub" (glowing circle with count).

### Step 3: Marker Logic Refactor [Implementation]
#### [REWRITE] [useEventMarkers.ts](file:///c:/Users/edmoq/Documents/caribe%20digital%20CR/frontend/src/hooks/map/useEventMarkers.ts)
*   **Delete**: The entire `proximityThreshold` and `Math.sqrt` loop.
*   **Implement**:
    *   Filter events based on Zoom Level (LOD).
    *   Pass filtered events to the `ClusterGroup` component instead of rendering `L.marker` directly.

## Executor Prompt
(See `executor_prompt_phase_21.md` for specific coding instructions)
