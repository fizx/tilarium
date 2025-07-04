# Tilarium [[live demo](https://fizx.github.io/tilarium/#eJyV00trwzAMAOD_onMO69LHln-w6-htDOGHlpq4VvCDtZT-94VmFM8ZwzsZpA8hJOsCoxWK9N5YCtC9XeAE3apt4Dw9uwbiFH_R0IH0Rg0BpedPB9dmdutKt6l020q3q3RPle75f26bOSVUTKHsLBcyhcM93y7zmtkjj-Qw8li2nsMPK3qUNhGKcrI_mOcejbZUNrXJkBVak0fJMfKxhO0SHo3-peK6Fj7WwtUS5lP5Vg-5YjWgJ_3XkoLpHdLJxPLn5uiQNA50nmu9NyCFGnrPyd2OY17lPYSK7bS26Gk6m7nInl_pdkzQuWTt9QsoZQqZ)]

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

## Developers

- Configurable: map size, tile size, asset pack, and layer groupingss.
- Exportable: simple json format for use the play mode of your game

## Data Format

The editor's input and output format is a JSON object that describes the tileset and map configuration. This allows you to load and save the editor's state, as well as create your own tilesets.

Here is a light example of the `tileset.json` format:

```json
{
  "gridSize": 32,
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
    },
    "coin_gold": {
      "displayName": "Gold Coin",
      "src": "assets/kenney_new-platformer-pack-1.0/Spritesheets/spritesheet-tiles-default.png",
      "zIndex": 3,
      "type": "tile",
      "spritesheet": {
        "x": 960,
        "y": 512,
        "width": 64,
        "height": 64
      }
    },
    "bush": {
      "displayName": "Bush",
      "src": "assets/kenney_new-platformer-pack-1.0/Spritesheets/spritesheet-tiles-default.png",
      "zIndex": 1,
      "type": "tile",
      "spritesheet": {
        "x": 960,
        "y": 832,
        "width": 64,
        "height": 64
      }
    }
  },
  "palettes": [
    {
      "name": "Essentials",
      "tiles": ["block_blue", "coin_gold", "bush"]
    }
  ]
}
```

For an example of how to transform a TexturePacker spritesheet XML into this format, see the `scripts/import-tileset.ts` script.
