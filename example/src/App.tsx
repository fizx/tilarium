import React, { useRef, useCallback, useEffect, useState } from "react";
import { TilemapEditor, EditorActions, TilemapState } from "../../src";
import tileset from "./tileset.json";
import { TileConfig } from "../../src/config";
import "./App.css";
import pako from "pako";

// Helper to compress and encode state for URL
const encodeState = (state: TilemapState): string => {
  const json = JSON.stringify(state);
  const compressed = pako.deflate(json, { to: "string" });
  return btoa(compressed);
};

// Helper to decode and decompress state from URL
const decodeState = (encoded: string): TilemapState | null => {
  try {
    const compressed = atob(encoded);
    const json = pako.inflate(compressed, { to: "string" });
    return JSON.parse(json);
  } catch (e) {
    console.error("Failed to decode state from URL", e);
    return null;
  }
};

function App() {
  const actionsRef = useRef<EditorActions | null>(null);
  const [initialState, setInitialState] = useState<TilemapState | undefined>(
    undefined
  );

  useEffect(() => {
    // Check for state in URL on initial load
    const hash = window.location.hash.slice(1);
    if (hash) {
      const decodedState = decodeState(hash);
      if (decodedState) {
        setInitialState(decodedState);
      }
    }
  }, []);

  const handleReady = useCallback(
    (actions: EditorActions) => {
      actionsRef.current = actions;
      // If initialState is available from URL, load it.
      if (initialState) {
        actions.loadState(initialState);
      }
    },
    [initialState]
  );

  const handleStateChange = useCallback((newState: TilemapState) => {
    const encodedState = encodeState(newState);
    // Use pushState to avoid adding to browser history for every change
    window.history.pushState(null, "", `#${encodedState}`);
  }, []);

  const canvasStyle = {
    background: "url('./assets/dragons.png') center/cover",
  };

  return (
    <div className="editor-wrapper">
      <TilemapEditor
        config={tileset as TileConfig}
        initialState={initialState}
        canvasStyle={canvasStyle}
        onReady={handleReady}
        onStateChange={handleStateChange}
        onTileSelect={(tile) => console.log("onTileSelect", tile)}
        onToolSelect={(tool) => console.log("onToolSelect", tool)}
      />
    </div>
  );
}

export default App;
