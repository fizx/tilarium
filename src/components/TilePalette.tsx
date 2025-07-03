import React, { useMemo, useState, useRef } from "react";
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const tileGroups = useMemo(() => {
    return Object.values(config.groups).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }, [config.groups]);

  const handleSelectTile = (tile: TileDefinition) => {
    setSelectedTile(tile);
    setSelectedTool("place");
  };

  const handleSelectEraser = () => {
    setSelectedTool("erase");
    setSelectedTile(undefined);
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
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
        {tileGroups.map((group) => (
          <button
            key={group.displayName}
            className={`tab-button ${
              activeTab === group.displayName ? "active" : ""
            }`}
            onClick={() => setActiveTab(group.displayName)}
          >
            {group.displayName}
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
        {tileGroups.map((group) => {
          if (activeTab === group.displayName) {
            return (
              <div key={group.displayName} className="carousel-container">
                <button
                  className="scroll-button left"
                  onClick={() => scroll("left")}
                >
                  &lt;
                </button>
                <div className="tile-grid" ref={scrollContainerRef}>
                  {group.tileIds.map((tileId) => {
                    const tile = config.tiles[tileId];
                    if (!tile) return null;
                    return (
                      <Tile
                        key={tile.displayName}
                        tile={tile}
                        onClick={() => handleSelectTile(tile)}
                        isSelected={
                          selectedTool === "place" &&
                          selectedTile?.displayName === tile.displayName
                        }
                      />
                    );
                  })}
                </div>
                <button
                  className="scroll-button right"
                  onClick={() => scroll("right")}
                >
                  &gt;
                </button>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};
