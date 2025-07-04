import React, { useRef, useCallback, useEffect, useState } from "react";
import { TilemapEditor, EditorActions, TilemapState } from "../../src";
import platformerTileset from "./tileset.json";
import townTileset from "./tileset-town.json";
import { TileConfig } from "../../src/config";
import "./App.css";
import pako from "pako";

// Helper to compress and encode state for URL
const encodeState = (state: TilemapState): string => {
  const json = JSON.stringify(state);
  const compressed = pako.deflate(json);
  const binaryString = Array.from(compressed, (byte) =>
    String.fromCharCode(byte)
  ).join("");
  const base64 = btoa(binaryString);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// Helper to decode and decompress state from URL
const decodeState = (encoded: string): TilemapState | null => {
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binaryString = atob(base64);
    const compressed = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      compressed[i] = binaryString.charCodeAt(i);
    }
    const json = pako.inflate(compressed, { to: "string" });
    return JSON.parse(json);
  } catch (e) {
    console.error("Failed to decode state from URL", e);
    return null;
  }
};

type Tileset = "platformer" | "town";

const tilesets: Record<Tileset, TileConfig> = {
  platformer: platformerTileset as TileConfig,
  town: townTileset as TileConfig,
};

function App() {
  const actionsRef = useRef<EditorActions | null>(null);
  const [initialState, setInitialState] = useState<TilemapState | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTileset, setSelectedTileset] = useState<Tileset>("platformer");

  useEffect(() => {
    // Check for state in URL on initial load
    const hash = window.location.hash.slice(1);
    if (hash) {
      const decodedState = decodeState(hash);
      if (decodedState) {
        setInitialState(decodedState);
      }
    }
    setIsLoading(false);
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

  const handleTilesetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTileset = event.target.value as Tileset;
    setSelectedTileset(newTileset);
    // when tileset changes, we should probably clear the state
    if (actionsRef.current) {
      actionsRef.current.loadState({
        placedTiles: [],
        tileToReplace: null,
        backgroundTileId: null,
      });
    }
  };

  const canvasStyle = {
    background: "url('./assets/dragons.png') center/cover",
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="editor-wrapper">
      <div className="toolbar-top">
        <select onChange={handleTilesetChange} value={selectedTileset}>
          <option value="platformer">Platformer</option>
          <option value="town">Town</option>
        </select>
      </div>
      <TilemapEditor
        config={tilesets[selectedTileset]}
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
