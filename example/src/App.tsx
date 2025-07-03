import React from "react";
import { TilemapEditor } from "../../src";
import tileset from "../assets/kenney_new-platformer-pack-1.0/tileset.json";
import { TileConfig } from "../../src/config";
import "./App.css";

function App() {
  return (
    <div className="editor-wrapper">
      <TilemapEditor config={tileset as TileConfig} />
    </div>
  );
}

export default App;
