import React, { useMemo, useState } from "react";
import { useEditor } from "../EditorContext";
import { Tile } from "./Tile";
import { TileDefinition } from "../config";

export const TilePalette = () => {
  const {
    config,
    selectedTile,
    setSelectedTile,
    setSelectedTool,
    selectedTool,
  } = useEditor();
  const [activeTab, setActiveTab] = useState<string | number>("Tools");

  const layers = useMemo(() => {
    const layerMap: Record<number, TileDefinition[]> = {};
    for (const tile of Object.values(config.tiles)) {
      if (!layerMap[tile.zIndex]) {
        layerMap[tile.zIndex] = [];
      }
      layerMap[tile.zIndex].push(tile);
    }
    return Object.entries(layerMap).sort(([a], [b]) => Number(a) - Number(b));
  }, [config.tiles]);

  const handleSelectTile = (tile: TileDefinition) => {
    setSelectedTile(tile);
    setSelectedTool("place");
  };

  const handleSelectEraser = () => {
    setSelectedTool("erase");
    setSelectedTile(undefined);
  };

  return (
    <div className="palette">
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === "Tools" ? "active" : ""}`}
          onClick={() => setActiveTab("Tools")}
        >
          Tools
        </button>
        {layers.map(([zIndex]) => (
          <button
            key={zIndex}
            className={`tab-button ${
              activeTab === Number(zIndex) ? "active" : ""
            }`}
            onClick={() => setActiveTab(Number(zIndex))}
          >
            Layer {zIndex}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {activeTab === "Tools" && (
          <div className="tool-panel">
            <button
              className={`tool-button ${
                selectedTool === "erase" ? "selected" : ""
              }`}
              onClick={handleSelectEraser}
            >
              Eraser
            </button>
          </div>
        )}
        {layers.map(([zIndex, tiles]) => {
          if (activeTab === Number(zIndex)) {
            return (
              <div key={zIndex} className="tile-grid">
                {tiles.map((tile) => (
                  <Tile
                    key={tile.displayName}
                    tile={tile}
                    onClick={() => handleSelectTile(tile)}
                    isSelected={
                      selectedTool === "place" &&
                      selectedTile?.displayName === tile.displayName
                    }
                  />
                ))}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};
