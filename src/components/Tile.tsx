import React, { useState, useEffect, useRef } from "react";
import { TileDefinition } from "../config";
import { TileSource } from "../state";
import { useEditor } from "../EditorContext";

interface EnrichedTile extends TileDefinition {
  source: TileSource;
}

interface TileProps {
  tile: EnrichedTile | null;
}

export const Tile: React.FC<TileProps> = ({ tile }) => {
  const { gridSize } = useEditor().config;
  const [displayTile, setDisplayTile] = useState(tile);
  const [animationClass, setAnimationClass] = useState("");
  const prevTileRef = useRef<EnrichedTile | null>();

  useEffect(() => {
    const prevTile = prevTileRef.current;
    const shouldFlash = tile?.source === "remote";

    if (tile && !prevTile) {
      setDisplayTile(tile);
      if (shouldFlash) {
        setAnimationClass("tile-animate-in");
      }
    } else if (!tile && prevTile) {
      const wasRemote = prevTile.source === "remote";
      if (wasRemote) {
        setAnimationClass("tile-animate-out");
      }
      setTimeout(() => setDisplayTile(null), wasRemote ? 350 : 0);
    } else if (tile && prevTile && tile.displayName !== prevTile.displayName) {
      if (shouldFlash) {
        setAnimationClass("tile-animate-out");
      }
      setTimeout(
        () => {
          setDisplayTile(tile);
          if (shouldFlash) {
            setAnimationClass("tile-animate-in");
          }
        },
        shouldFlash ? 350 : 0
      );
    }

    prevTileRef.current = tile;
  }, [tile]);

  if (!displayTile) {
    return null;
  }

  const { displayName, src, spritesheet } = displayTile;

  const style: React.CSSProperties = {
    width: gridSize,
    height: gridSize,
    overflow: "hidden",
    position: "relative",
  };

  if (!spritesheet) {
    return (
      <div className={`tile ${animationClass}`} style={style}>
        <img
          src={src}
          alt={displayName}
          className="tile-image"
          style={{ width: gridSize, height: gridSize }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  const scale = gridSize / spritesheet.width;

  const imageStyle: React.CSSProperties = {
    position: "absolute",
    left: -spritesheet.x * scale,
    top: -spritesheet.y * scale,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };

  return (
    <div
      className={`tile ${animationClass}`}
      style={style}
      onDragStart={(e) => e.preventDefault()}
    >
      <img
        src={src}
        alt={displayName}
        style={imageStyle}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
};
