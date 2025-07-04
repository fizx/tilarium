import React from "react";
import { useEditor } from "../EditorContext";

export const Background = () => {
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

  const imageStyle: React.CSSProperties = {
    position: "absolute",
    left: `${-tileDef.spritesheet.x}px`,
    top: `${-tileDef.spritesheet.y}px`,
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
