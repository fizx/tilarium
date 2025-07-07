# Tilarium [[live demo](https://fizx.github.io/tilarium/#eJytl8FuozAQht_FZyph7Jgk1z31tNKqtyqyHOwAisGRMW3TKu--Jkm1sGmckcURA98H9ujXzBfqnHAKrb_QQYtCyZdaq2645O548OuoEQeUoDehe3_1-ooWT1mKkrv3M3_rA60XCTqidZYmyHngs_QPaiGlsnxrnDONf6UzvS0GgjaF0Oi02Zw2ycDHKygfr275TS2lVkH-EsxfRvFzMD-P4jMwn0XxF2D-IopPwXx6y3fmEISTAJxM4GQMN8WeWyXvo_ETDpDZhYwv5BG46iWvlLDuPjmDkLMYMoGQSQyZQsg0hoxZuMCvZziU9v8VvtOiHA6RbwN4GsbjK57e4qta66H8eNfUoQrHJBwB6VVBbjPAKWtF3XJZW8crY-tP0zqhuXlTthJtybXahfYuh5nzCLOtyyqkpjA1hasfJQl-ELXfyh-yNlrJYEo2n5KF8_hqZLd5HCvMQcJ8PuESJFzOJ1yBhKv5hDgFGXE6oxLDlBiuhEYBBZnpfP9KQEIynzADCbOIrQ3nexbunfDEO-6d3utWmvdwtYTIZFotk7ZM-W9_VBIs3NSTSYiNm_q9OobbMj-OhDqRdDKO4B-OorSi6yLOgoHELEYc2szN6YJ6MX_UeWJD67bXOkFbUexLa_r2PMKdTf-WeGG08b2zVX64-wb_3v0adCPBBd0p55c83O2MbZRFp79Xk4Oc)]

[![CI](https://github.com/fizx/tilarium/actions/workflows/ci.yml/badge.svg)](https://github.com/fizx/tilarium/actions/workflows/ci.yml)

Tilarium is a web-based 2D tilemap editor with Super Mario Maker vibes. It's an MVP shipped as a lightweight npm library that can be embedded in any web app and runs entirely in-browser.

## Features

- Touch-Friendly: The editor is optimized for tap, drag, and pinch interactions, making it seamless to use on phones and tablets.
- Lightweight: It loads instantly, runs entirely in-browser, and keeps performance smooth even on low-end devices.
- Embeddable: The editor is self-contained and easily pluggable into any webview with no backend or build tools required.
- Devvit-Ready: Easily integrate into Devvit apps on Reddit.
- Uses open asset packs, e.g: https://kenney.nl/assets/new-platformer-pack

## Usage

First, install the package:

```bash
npm install tilarium
```

Then, you can use the `TilemapEditor` component in your React application. You will also need to import the stylesheet.

```tsx
import React from "react";
import { TilemapEditor, TileConfig } from "tilarium";
import "tilarium/dist/TilemapEditor.css";

// You'll need to provide your own tileset configuration.
// See the example/ folder for a full implementation and how to create a tileset.
import tileset from "./tileset.json";

function MyMapEditor() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <TilemapEditor
        config={tileset as TileConfig}
        onStateChange={(state) => console.log("state changed:", state)}
      />
    </div>
  );
}

export default MyMapEditor;
```

## Usage with Vanilla JS

For use in non-React contexts, you can use the `mount` helper to render the editor into a DOM element.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Tilarium Editor</title>
    <link
      rel="stylesheet"
      href="node_modules/tilarium/dist/TilemapEditor.css"
    />
  </head>
  <body>
    <div id="editor-container" style="width: 100vw; height: 100vh;"></div>

    <script type="module">
      import { mount } from "tilarium";
      import tileset from "./tileset.json";

      const editor = mount("#editor-container", {
        config: tileset,
        onStateChange: (state) => {
          console.log("state changed:", state);
          // You can save the state to localStorage, for example.
          localStorage.setItem("tilarium-state", JSON.stringify(state));
        },
      });

      // To unmount the editor later:
      // editor.unmount();
    </script>
  </body>
</html>
```

## Editor

- Grid-based: all tiles are the same size and shape for simplicity.
- Simple toolset: place tile, scroll, eraser
- Multiple layers: each tile has an inherent zIndex (e.g. ocean-tile: 0, shark: 1). Conflicting tiles can't be placed at the same layer and position. Eraser targets the top tile at that location. No pick-a-layer affordances for simplicity.

## For Developers

Tilarium is designed to be configurable and extensible. This section covers the data formats and lifecycle hooks available for developers.

### Data Format

The editor's input and output format is a JSON object that describes the tileset and map configuration. This allows you to load and save the editor's state, as well as create your own tilesets.

The `config` prop of the `TilemapEditor` component expects an object that conforms to the `TileConfig` interface. Here is a light example of the data structure:

```json
{
  "gridSize": 32,
  "defaultZoom": 0.5,
  "mapSize": {
    "width": 16,
    "height": 16
  },
  "tiles": {
    "block_blue": {
      "displayName": "Blue Block",
      "src": "assets/kenney_new-platformer-pack-1.0/Spritesheets/spritesheet-tiles-default.png",
      "zIndex": 2,
      "type": "tile",
      "spritesheet": {
        "x": 0,
        "y": 0,
        "width": 64,
        "height": 64
      }
    }
  },
  "groups": {
    "essentials": {
      "displayName": "Essentials",
      "tileIds": ["block_blue"]
    }
  }
}
```

For an example of how to transform a TexturePacker spritesheet XML into this format, see the `scripts/import-tileset.ts` script.

### Lifecycle Hooks

The `TilemapEditor` component provides several lifecycle hooks that allow you to respond to events within the editor.

- `onReady(actions: EditorActions)`: Fires when the editor is initialized. The `actions` object contains functions to interact with the editor state:
  - `getState(): TilemapState`: Returns the current state of the tilemap.
  - `loadState(state: TilemapState)`: Loads a new state into the editor.
- `onStateChange(state: TilemapState)`: Fires whenever the tilemap state is modified (e.g., adding or removing a tile).
- `onCameraChange(camera: Camera)`: Fires when the camera's position or zoom level changes.
- `onToolSelect(tool: Tool)`: Fires when a new tool is selected from the toolbar.
- `onTileSelect(tile?: TileDefinition)`: Fires when a tile is selected from the palette.

The `onStateChange` hook provides a `TilemapState` object. Here is an example of its structure:

```json
{
  "placedTiles": [
    {
      "x": 1,
      "y": 2,
      "tileId": "block_blue"
    }
  ],
  "tileToReplace": null,
  "backgroundTileId": "background_sky"
}
```

### Collaborative Editing

When building a collaborative experience with Tilarium, it's important to understand how autotiling and state changes are handled.

When a user places or removes a tile, the autotiling logic is applied on the client _before_ any changes are sent to the server. The `onStateChange` callback will then provide a delta of all tiles that were modified as a result of the autotiling. This delta should be sent to the server and then broadcast to all other clients.

When a client receives a delta from the server, it should apply it directly to its local state without re-running the autotiling logic. This is because the delta already represents the final, autotiled state of the map. The `applyRemoteDelta` action is designed for this purpose.
