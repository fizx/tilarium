import React from "react";
import { TilemapEditor } from "../../src";
import tileset from "../assets/kenney_new-platformer-pack-1.0/tileset.json";
import { TileConfig } from "../../src/config";

function App() {
  return (
    <div>
      <h1>Tilemap Editor Example</h1>
      <TilemapEditor config={tileset as TileConfig} />
    </div>
  );
}

export default App;
