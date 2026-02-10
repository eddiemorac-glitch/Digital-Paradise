# Implementation Plan - Phase 20: Visual Map Polish & Event Clustering 🎨

**Goal**: Resolve the "strange" visual appearance of map events by implementing proper clustering, refining marker aesthetics, and optimizing performance.

## User Review Required
> [!IMPORTANT]
> **Visual Overhaul**: We will introduce `react-leaflet-cluster` (or similar logic) to group events that are too close, preventing visual clutter ("strange look").
> 
> **CSS Optimization**: Some CSS animations in `LiveMap.css` (like `rain-effect` and complex box-shadows) might be too heavy. We will simplify them for better rendering performance.

## Proposed Changes

### Component 1: Event Clustering Strategy

#### [MODIFY] [useEventMarkers.ts](file:///c:/Users/edmoq/Documents/caribe%20digital%20CR/frontend/src/hooks/map/useEventMarkers.ts) (or create if missing logic)
*   **Logic**: Instead of rendering every single event as a `Marker`, check if the zoom level is low (<14).
*   **Behavior**:
    *   **Low Zoom (<14)**: Render a single "Cluster Icon" (e.g., a number inside a circle) for groups of events.
    *   **High Zoom (>=14)**: Show individual "Premium Markers".

### Component 2: CSS Refinement

#### [MODIFY] [LiveMap.css](file:///c:/Users/edmoq/Documents/caribe%20digital%20CR/frontend/src/components/LiveMap.css)
*   **Fix Z-Index**: Ensure `glass-banner` (labels) always sits *above* `p-aura` (glow effects) but *below* any active modal.
*   **Simplify Animations**:
    *   Reduce `box-shadow` complexity on mobile devices using `@media`.
    *   Tone down `b-neon-stable` animation speed to reduce jitter.

### Component 3: Marker Icon Calibration

#### [MODIFY] [LiveMap.tsx](file:///c:/Users/edmoq/Documents/caribe%20digital%20CR/frontend/src/components/LiveMap.tsx)
*   **Icon Anchor**: Verify that `L.divIcon` anchor points are correctly centered. If the anchor is `[0, 0]` instead of `[12, 12]` (half size), markers will look "drifted".
*   **Size consistency**: Ensure all event markers share a base scale logic to prevent some looking huge next to tiny ones.

## Verification Plan

### Automated Verification
*   **None**: This is largely visual.

### Manual Verification
1.  **Zoom Test**: Zoom out to see if events cluster nicely (or at least don't overlap chaotically).
2.  **Pan Test**: Move around and verify markers stick to their coords without "floating".
3.  **Aesthetic Check**: Confirm the "Glass Banners" are readable and not flickering.
