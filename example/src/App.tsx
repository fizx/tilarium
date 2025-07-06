import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  TilemapEditor,
  EditorActions,
  TilemapState,
  PlacedTile,
} from "../../src";
import platformerTileset from "./tileset.json";
import townTileset from "./tileset-town.json";
import { TileConfig } from "../../src/config";
import "./App.css";
import pako from "pako";

type Tileset = "platformer" | "town";

interface SavedState {
  tileset: Tileset;
  state: TilemapState;
}

// Helper to compress and encode state for URL
const encodeState = (state: TilemapState, tileset: Tileset): string => {
  const data: SavedState = { state, tileset };

  const replacer = (key: string, value: any) => {
    if (value instanceof Map) {
      return {
        _type: "map",
        value: Array.from(value.entries()),
      };
    }
    return value;
  };

  const json = JSON.stringify(data, replacer);
  const compressed = pako.deflate(json);
  const binaryString = Array.from(compressed, (byte) =>
    String.fromCharCode(byte)
  ).join("");
  const base64 = btoa(binaryString);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// Helper to decode and decompress state from URL
const decodeState = (encoded: string): SavedState | null => {
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
    const reviver = (key: string, value: any) => {
      if (typeof value === "object" && value !== null) {
        if (value._type === "map") {
          return new Map(value.value);
        }
      }
      return value;
    };
    const json = pako.inflate(compressed, { to: "string" });
    const decoded = JSON.parse(json, reviver);
    console.log("[decodeState] Decoded from URL:", decoded);

    // New format
    if (decoded.state && decoded.tileset) {
      const placedTilesIsObject =
        decoded.state.placedTiles &&
        typeof decoded.state.placedTiles === "object" &&
        !Array.isArray(decoded.state.placedTiles) &&
        !(decoded.state.placedTiles instanceof Map);

      if (placedTilesIsObject) {
        const placedTilesMap = new Map();
        for (const [key, cellObj] of Object.entries(
          decoded.state.placedTiles
        )) {
          const cellMap = new Map();
          for (const [zIndex, tile] of Object.entries(
            cellObj as Record<string, PlacedTile | null>
          )) {
            cellMap.set(parseInt(zIndex, 10), tile);
          }
          placedTilesMap.set(key, cellMap);
        }
        decoded.state.placedTiles = placedTilesMap;
      }
      return decoded as SavedState;
    }

    // Legacy format
    if (decoded.placedTiles) {
      return {
        state: decoded as TilemapState,
        tileset: "platformer", // default to platformer for old links
      };
    }

    return null;
  } catch (e) {
    console.error("Failed to decode state from URL", e);
    return null;
  }
};

const tilesets: Record<Tileset, TileConfig> = {
  platformer: platformerTileset as unknown as TileConfig,
  town: townTileset as unknown as TileConfig,
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
      const decoded = decodeState(hash);
      if (decoded) {
        setSelectedTileset(decoded.tileset);
        setInitialState(decoded.state);
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

  const handleStateChange = useCallback(
    (newState: TilemapState) => {
      const encodedState = encodeState(newState, selectedTileset);
      // Use pushState to avoid adding to browser history for every change
      window.history.pushState(null, "", `#${encodedState}`);
    },
    [selectedTileset]
  );

  const handleTilesetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTileset = event.target.value as Tileset;
    setSelectedTileset(newTileset);
    // when tileset changes, we should probably clear the state
    if (actionsRef.current) {
      actionsRef.current.loadState({
        placedTiles: new Map(),
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
