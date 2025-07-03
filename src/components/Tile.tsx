import React from "react";
import { TileDefinition } from "../config";

interface TileProps {
  tile: TileDefinition;
  onClick: () => void;
  isSelected: boolean;
}

export const Tile: React.FC<TileProps> = ({ tile, onClick, isSelected }) => {
  const style: React.CSSProperties = {
    border: isSelected ? "2px solid blue" : "2px solid transparent",
    width: tile.spritesheet
      ? tile.spritesheet.width * (tile.scale ?? 1)
      : "100%",
    height: tile.spritesheet
      ? tile.spritesheet.height * (tile.scale ?? 1)
      : "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden",
    position: "relative",
  };

  const imageStyle: React.CSSProperties = {
    position: "absolute",
    transform: `scale(${tile.scale ?? 1})`,
    transformOrigin: "top left",
    left: tile.spritesheet ? -tile.spritesheet.x * (tile.scale ?? 1) : 0,
    top: tile.spritesheet ? -tile.spritesheet.y * (tile.scale ?? 1) : 0,
  };

  return (
    <div onClick={onClick} style={style}>
      <img src={tile.src} alt={tile.displayName} style={imageStyle} />
    </div>
  );
};
