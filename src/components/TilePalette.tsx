import React, { useMemo, useState } from "react";
import { useEditor } from "../EditorContext";
import { Tile } from "./Tile";
import { TileDefinition } from "../config";

export const TilePalette = () => {
  const { config, selectedTile, setSelectedTile, setSelectedTool } =
    useEditor();
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

  return (
    <div>
      <div>
        <button onClick={() => setActiveTab("Tools")}>Tools</button>
        {layers.map(([zIndex]) => (
          <button key={zIndex} onClick={() => setActiveTab(Number(zIndex))}>
            Layer {zIndex}
          </button>
        ))}
      </div>
      <div>
        {activeTab === "Tools" && (
          <div>
            <button onClick={() => setSelectedTool("erase")}>Eraser</button>
          </div>
        )}
        {layers.map(([zIndex, tiles]) => {
          if (activeTab === Number(zIndex)) {
            return (
              <div key={zIndex}>
                {tiles.map((tile) => (
                  <Tile
                    key={tile.displayName}
                    tile={tile}
                    onClick={() => handleSelectTile(tile)}
                    isSelected={selectedTile?.displayName === tile.displayName}
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
