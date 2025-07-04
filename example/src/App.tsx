import React, { useRef, useCallback } from "react";
import { TilemapEditor, EditorActions, TilemapState } from "../../src";
import tileset from "../assets/kenney_new-platformer-pack-1.0/tileset.json";
import { TileConfig } from "../../src/config";
import "./App.css";

const LOCAL_STORAGE_KEY = "tilemapState";

function App() {
  const actionsRef = useRef<EditorActions | null>(null);

  // Reset logic
  if (window.location.search.includes("reset")) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    // clean url
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const handleReady = useCallback((actions: EditorActions) => {
    actionsRef.current = actions;
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        actions.loadState(JSON.parse(savedState));
      }
    } catch (e) {
      console.error("Failed to load state from local storage", e);
    }
  }, []);

  const handleStateChange = useCallback((newState: TilemapState) => {
    console.log("onStateChange", newState);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error("Failed to save state to local storage", e);
    }
  }, []);

  const canvasStyle = {
    background: "url('/dragons.png') center/cover",
  };

  return (
    <div className="editor-wrapper">
      <TilemapEditor
        config={tileset as TileConfig}
        canvasStyle={canvasStyle}
        onReady={handleReady}
        onStateChange={handleStateChange}
        onCameraChange={(camera) => console.log("onCameraChange", camera)}
        onTileSelect={(tile) => console.log("onTileSelect", tile)}
        onToolSelect={(tool) => console.log("onToolSelect", tool)}
      />
    </div>
  );
}

export default App;
