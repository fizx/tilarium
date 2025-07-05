import React, { useState, useEffect, useRef } from "react";
import { TileDefinition } from "../config";
import { useEditor } from "../EditorContext";

interface TileProps {
  tile: TileDefinition;
}

export const Tile: React.FC<TileProps> = ({ tile }) => {
  const { config } = useEditor();
  const { gridSize } = config;
  const [displaySrc, setDisplaySrc] = useState(tile.src);
  const [displaySpritesheet, setDisplaySpritesheet] = useState(
    tile.spritesheet
  );
  const tileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      tile.src !== displaySrc ||
      JSON.stringify(tile.spritesheet) !== JSON.stringify(displaySpritesheet)
    ) {
      if (tileRef.current) {
        tileRef.current.style.transition = "opacity 0.15s ease-out";
        tileRef.current.style.opacity = "0";
      }

      setTimeout(() => {
        setDisplaySrc(tile.src);
        setDisplaySpritesheet(tile.spritesheet);
        if (tileRef.current) {
          tileRef.current.style.transition = "opacity 0.15s ease-in";
          tileRef.current.style.opacity = "1";
        }
      }, 150);
    }
  }, [tile.src, tile.spritesheet, displaySrc, displaySpritesheet]);

  if (!displaySpritesheet) {
    return (
      <div
        ref={tileRef}
        className="tile"
        style={{ width: gridSize, height: gridSize }}
      >
        <img
          src={displaySrc}
          alt={tile.displayName}
          className="tile-image"
          style={{ width: gridSize, height: gridSize }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  const scale = gridSize / displaySpritesheet.width;

  const wrapperStyle: React.CSSProperties = {
    width: gridSize,
    height: gridSize,
    overflow: "hidden",
    position: "relative",
  };

  const imageStyle: React.CSSProperties = {
    position: "absolute",
    left: -displaySpritesheet.x * scale,
    top: -displaySpritesheet.y * scale,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };

  return (
    <div
      ref={tileRef}
      className="tile"
      style={wrapperStyle}
      onDragStart={(e) => e.preventDefault()}
    >
      <img
        src={displaySrc}
        alt={tile.displayName}
        style={imageStyle}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
};
