import React, { useState, useEffect, useRef } from "react";
import { TileDefinition } from "../config";
import { useEditor } from "../EditorContext";

interface TileProps {
  tile: TileDefinition;
}

export const Tile: React.FC<TileProps> = ({ tile }) => {
  const { config } = useEditor();
  const { gridSize } = config;
  const [imageUrl, setImageUrl] = useState(tile.src);
  const tileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tile.src !== imageUrl) {
      if (tileRef.current) {
        tileRef.current.style.transition = "opacity 0.3s ease-in-out";
        tileRef.current.style.opacity = "0";
      }
      setTimeout(() => {
        setImageUrl(tile.src);
        if (tileRef.current) {
          tileRef.current.style.opacity = "1";
        }
      }, 300);
    }
  }, [tile.src, imageUrl]);

  if (!tile.spritesheet) {
    return (
      <div ref={tileRef} style={{ width: gridSize, height: gridSize }}>
        <img
          src={imageUrl}
          alt={tile.displayName}
          className="tile-image"
          style={{ width: gridSize, height: gridSize }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  const scale = gridSize / tile.spritesheet.width;

  const wrapperStyle: React.CSSProperties = {
    width: gridSize,
    height: gridSize,
    overflow: "hidden",
    position: "relative",
  };

  const imageStyle: React.CSSProperties = {
    position: "absolute",
    left: -tile.spritesheet.x * scale,
    top: -tile.spritesheet.y * scale,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };

  return (
    <div
      ref={tileRef}
      style={wrapperStyle}
      onDragStart={(e) => e.preventDefault()}
    >
      <img
        src={imageUrl}
        alt={tile.displayName}
        style={imageStyle}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
};
