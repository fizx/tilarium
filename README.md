# Devvit Tilemap Editor [[live demo](https://fizx.github.io/tilarium/#eJyV00trwzAMAOD_onMO69LHln-w6-htDOGHlpq4VvCDtZT-94VmFM8ZwzsZpA8hJOsCoxWK9N5YCtC9XeAE3apt4Dw9uwbiFH_R0IH0Rg0BpedPB9dmdutKt6l020q3q3RPle75f26bOSVUTKHsLBcyhcM93y7zmtkjj-Qw8li2nsMPK3qUNhGKcrI_mOcejbZUNrXJkBVak0fJMfKxhO0SHo3-peK6Fj7WwtUS5lP5Vg-5YjWgJ_3XkoLpHdLJxPLn5uiQNA50nmu9NyCFGnrPyd2OY17lPYSK7bS26Gk6m7nInl_pdkzQuWTt9QsoZQqZ)]

[![CI](https://github.com/fizx/tilarium/actions/workflows/ci.yml/badge.svg)](https://github.com/fizx/tilarium/actions/workflows/ci.yml)

Let's make a web-based 2D tilemap editor that runs inside Devvit. Think: Super Mario Maker vibes, but for Reddit. This is an MVP and shipped as an npm library that doesn't need server components.

![Example Tilemap Editor](screenshot.png)

## Features

- Touch-Friendly: The editor is optimized for tap, drag, and pinch interactions, making it seamless to use on phones and tablets.
- Lightweight: It loads instantly, runs entirely in-browser, and keeps performance smooth even on low-end devices.
- Embeddable: The editor is self-contained and easily pluggable into any Devvit app or webview with no backend or build tools required
- Uses open asset packs, e.g: https://kenney.nl/assets/new-platformer-pack

## Editor

- Grid-based: all tiles are the same size and shape for simplicity.
- Simple toolset: place tile, scroll, eraser
- Multiple layers: each tile has an inherent zIndex (e.g. ocean-tile: 0, shark: 1). Conflicting tiles can't be placed at the same layer and position. Eraser targets the top tile at that location. No pick-a-layer affordances for simplicity.

## Developers

- Configurable: map size, tile size, asset pack, and layer groupingss.
- Exportable: simple json format for use the play mode of your game

## CI/CD

This project uses GitHub Actions to automatically deploy the example application to GitHub Pages.
