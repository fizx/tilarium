import React from "react";
import { useEditor } from "../EditorContext";

interface BackgroundProps {
  mapSize: { width: number; height: number } | null;
}

export const Background: React.FC<BackgroundProps> = ({ mapSize }) => {
  const { config, state } = useEditor();
  const { backgroundTileId } = state;

  if (!backgroundTileId) return null;

  const tileDef = config.tiles[backgroundTileId];
  if (!tileDef) return null;

  if (!tileDef.spritesheet) {
    return (
      <img
        src={tileDef.src}
        alt={tileDef.displayName}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        onDragStart={(e) => e.preventDefault()}
      />
    );
  }

  if (!mapSize) return null; // Or some fallback for infinite map

  const scaleX = mapSize.width / tileDef.spritesheet.width;
  const scaleY = mapSize.height / tileDef.spritesheet.height;

  const imageStyle: React.CSSProperties = {
    position: "absolute",
    left: `${-tileDef.spritesheet.x * scaleX}px`,
    top: `${-tileDef.spritesheet.y * scaleY}px`,
    transform: `scale(${scaleX}, ${scaleY})`,
    transformOrigin: "top left",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <img
        src={tileDef.src}
        alt={tileDef.displayName}
        style={imageStyle}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
};
