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
  const [activeTab, setActiveTab] = useState(
    Object.values(config.groups).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    )[0]?.displayName || ""
  );
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
        {tileGroups.map((group) => {
          if (activeTab === group.displayName) {
            return (
              <div key={group.displayName} className="carousel-container">
                <div
                  className="scroll-button left"
                  onClick={() => scroll("left")}
                >
                  ❮
                </div>
                <div
                  className={`tile-grid ${
                    group.displayName === "backgrounds"
                      ? "backgrounds-grid"
                      : ""
                  }`}
                  ref={scrollContainerRef}
                >
                  {group.tileIds.map((tileId) => {
                    const tile = config.tiles[tileId];
                    if (!tile) return null;
                    const isSelected =
                      selectedTool === "place" &&
                      selectedTile?.displayName === tile.displayName;
                    return (
                      <div
                        key={tile.displayName}
                        className={`tile-wrapper ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => handleSelectTile(tile)}
                        title={tile.displayName}
                      >
                        <div className="tile-image-wrapper">
                          <div
                            style={{
                              transform: `scale(${config.defaultZoom})`,
                            }}
                          >
                            <Tile tile={tile} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div
                  className="scroll-button right"
                  onClick={() => scroll("right")}
                >
                  ❯
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};
