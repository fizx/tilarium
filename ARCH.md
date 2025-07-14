# Tilarium Architecture

This document outlines the high-level architecture of the Tilarium tilemap editor, focusing on its React component structure and data flow. The architecture is designed to follow standard React principles, such as unidirectional data flow and clear separation of concerns.

## Component Hierarchy & Responsibilities

The application is broken down into three main logical components, each with a distinct responsibility.

### 1. `TilemapEditor` (The Conductor / Model Controller)

- **Location:** `src/TilemapEditor.tsx`
- **Description:** This is the top-level component that orchestrates the entire editor. It is responsible for composing the main UI components and managing the application's core data and business logic.
- **Manages & Owns:**
  - The core tilemap data (`placedTiles`, `backgroundTileId`).
  - The main `useReducer` instance, which handles all business logic for mutating tile data (e.g., autotiling, validation, filling rectangles).
  - The application's tool state (`selectedTool`, `selectedTile`, `placeMode`, etc.).
  - The `EditorContext`, which provides global state and the action dispatcher to its children.
- **Renders & Composes:**
  - The main UI layout, including the `Toolbar`, `TilePalette`, and `Viewport`.
- **Does Not Directly Own:**
  - Raw user input handling for the map area (this is owned by the `Viewport`).

### 2. `Viewport` (The Interaction & View Controller)

- **Location:** `src/components/Viewport.tsx`
- **Description:** This component is the "window" through which the tilemap is viewed. It is responsible for all navigation and direct user interaction with the map area.
- **Owns & Manages:**
  - The `camera` state (`x`, `y`, `zoom`). This is the single source of truth for the camera.
  - All direct mouse and touch event listeners (`onMouseDown`, `onMouseMove`, `onMouseUp`, `onWheel`).
  - The logic to differentiate between interaction types (panning, drawing a rectangle, painting single tiles).
  - The rendering of the `<CustomCursor />` and the rectangle selection preview.
- **Delegates:** It calls delegate props (`onPaint`, `onRectangleSelect`) to inform the `TilemapEditor` of completed user actions that should result in a data change.

### 3. `HTML5Canvas` (The Dumb Renderer)

- **Location:** `src/components/HTML5Canvas.tsx`
- **Description:** This is a pure, "dumb" presentational component. Its sole responsibility is to render pixels to a `<canvas>` element based on the props it receives.
- **Receives as Props:**
  - The `camera` state from the `Viewport`.
  - The `placedTiles` data from the `TilemapEditor` (via context).
- **Does Not Own:**
  - Any state or application logic.
  - Any event handlers (its events are handled by the parent `Viewport`).

## Data Flow

The data flow is designed to be unidirectional (top-down), which makes the application easier to reason about and debug.

1.  **User Interaction:** The user interacts with the `Viewport` (e.g., clicks the mouse).
2.  **Delegation:** The `Viewport` processes the raw input.
    - If it's a **navigation** action (pan/zoom), the `Viewport` updates its own internal `camera` state.
    - If it's an **editing** action (paint/rectangle), it calls a delegate prop (`onPaint`, `onRectangleSelect`) passed down from the `TilemapEditor`.
3.  **Business Logic:** The `TilemapEditor` receives the delegate call and decides what it means based on the current tool state. It then dispatches an action to its `reducer`.
4.  **State Update:** The `reducer` executes the business logic (e.g., runs the autotile algorithm) and produces a new, immutable `placedTiles` state.
5.  **Re-render:** The state update triggers a re-render of the components.
    - The `Viewport` receives the new `camera` state (if it changed).
    - The `HTML5Canvas` receives the new `camera` and `placedTiles` state and redraws the canvas to reflect the changes.

This clear separation ensures that components are decoupled, reusable, and have well-defined roles within the application.
