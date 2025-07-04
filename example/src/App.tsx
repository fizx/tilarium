import React from "react";
import { TilemapEditor } from "../../src";
import tileset from "../assets/kenney_new-platformer-pack-1.0/tileset.json";
import { TileConfig } from "../../src/config";
import "./App.css";

function App() {
  const canvasStyle = {
    background: "url('/dragons.png') center/cover",
  };

  return (
    <div className="editor-wrapper">
      <TilemapEditor config={tileset as TileConfig} canvasStyle={canvasStyle} />
    </div>
  );
}

export default App;
