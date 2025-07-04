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

## Editor

- Grid-based: all tiles are the same size and shape for simplicity.
- Simple toolset: place tile, scroll, eraser
- Multiple layers: each tile has an inherent zIndex (e.g. ocean-tile: 0, shark: 1). Conflicting tiles can't be placed at the same layer and position. Eraser targets the top tile at that location. No pick-a-layer affordances for simplicity.

## Developers

- Configurable: map size, tile size, asset pack, and layer groupingss.
- Exportable: simple json format for use the play mode of your game

## CI/CD

This project uses GitHub Actions to automatically deploy the example application to GitHub Pages.
