import React, { useMemo, useState, useRef, useLayoutEffect } from "react";
import { Tile } from "./Tile";
import { useEditor } from "../EditorContext";
import { TileDefinition } from "../config";
import { PlacedTiles } from "../state";
import {
  calculateBitmask,
  getStrictlyValidTileIds,
  chooseTileVariant,
} from "../autotile";

type PreviewSize = { width: number; height: number };

const previewCache = new Map<
  string,
  { tilesToRender: JSX.Element[]; gridSize: PreviewSize }
>();

interface AutotilePreviewProps {
  tile: TileDefinition;
  isAutotile: boolean;
  previewSizes?: string[];
}

export const AutotilePreview = ({
  tile,
  isAutotile,
  previewSizes = ["1x2", "2x1", "1x3", "3x1", "3x3", "5x5"],
}: AutotilePreviewProps) => {
  const { config, autotileLookup } = useEditor();
  const autotileGroup = tile.autotile?.group;
  const [scale, setScale] = useState(1);
  const previewContentRef = useRef<HTMLDivElement>(null);

  const { tilesToRender, gridSize } = useMemo(() => {
    if (isAutotile && autotileGroup) {
      if (previewCache.has(autotileGroup)) {
        return previewCache.get(autotileGroup)!;
      }

      const groupLookup = autotileLookup.get(autotileGroup);
      if (!groupLookup)
        return { tilesToRender: [], gridSize: { width: 1, height: 1 } };

      const tileEntry = Object.entries(config.tiles).find(
        ([, t]) => t.displayName === tile.displayName
      );
      if (!tileEntry)
        return { tilesToRender: [], gridSize: { width: 1, height: 1 } };
      const baseTileId = tileEntry[0];

      const generatePreviewData = (renderSize: PreviewSize) => {
        const calcGridWidth = renderSize.width + 2;
        const calcGridHeight = renderSize.height + 2;
        const placedTiles: PlacedTiles = new Map();

        for (let y = 1; y < calcGridHeight - 1; y++) {
          for (let x = 1; x < calcGridWidth - 1; x++) {
            const key = `${x}-${y}`;
            const cell = new Map();
            cell.set(tile.zIndex, {
              tileId: baseTileId,
              instanceId: "preview",
            });
            placedTiles.set(key, cell);
          }
        }

        const tileIds = new Set<string>();
        const renderedComponents = [];

        for (let y = 1; y < calcGridHeight - 1; y++) {
          for (let x = 1; x < calcGridWidth - 1; x++) {
            const bitmask = calculateBitmask(
              x,
              y,
              placedTiles,
              autotileGroup,
              config
            );
            const validTileIds = getStrictlyValidTileIds(groupLookup, bitmask);

            if (validTileIds && validTileIds.length > 0) {
              const tileIdToRender = chooseTileVariant(validTileIds);
              tileIds.add(tileIdToRender);
              const tileDef = config.tiles[tileIdToRender];
              if (tileDef) {
                renderedComponents.push(
                  <div key={`${x}-${y}`} style={{ gridColumn: x, gridRow: y }}>
                    <Tile tile={{ ...tileDef, source: "local" }} />
                  </div>
                );
              }
            }
          }
        }

        return {
          tilesToRender: renderedComponents,
          tileIds,
          gridSize: renderSize,
        };
      };

      const parsedSizes: PreviewSize[] = previewSizes
        .map((s) => {
          const parts = s.split("x");
          if (parts.length !== 2) return null;
          const width = parseInt(parts[0], 10);
          const height = parseInt(parts[1], 10);
          if (isNaN(width) || isNaN(height)) return null;
          return { width, height };
        })
        .filter((s): s is PreviewSize => s !== null);

      const sortedSizes = parsedSizes.sort(
        (a, b) => a.width * a.height - b.width * b.height
      );

      if (sortedSizes.length === 0) {
        return { tilesToRender: [], gridSize: { width: 1, height: 1 } };
      }

      let bestPreview = generatePreviewData(sortedSizes[0]);

      for (let i = 1; i < sortedSizes.length; i++) {
        const currentPreview = generatePreviewData(sortedSizes[i]);
        const hasNewTiles = [...currentPreview.tileIds].some(
          (id) => !bestPreview.tileIds.has(id)
        );

        if (hasNewTiles) {
          bestPreview = currentPreview;
        } else {
          break;
        }
      }

      const result = {
        tilesToRender: bestPreview.tilesToRender,
        gridSize: bestPreview.gridSize,
      };

      previewCache.set(autotileGroup, result);

      return result;
    } else {
      // Non-autotile logic (1x1 tile)
      return {
        tilesToRender: [
          <Tile key={tile.displayName} tile={{ ...tile, source: "local" }} />,
        ],
        gridSize: { width: 1, height: 1 },
      };
    }
  }, [isAutotile, autotileGroup, tile, config, autotileLookup, previewSizes]);

  useLayoutEffect(() => {
    if (previewContentRef.current && !isAutotile) {
      // For single tiles, no scaling is needed as we control the size
      setScale(1);
      return;
    }

    if (previewContentRef.current) {
      const containerSize = 140; // 160px pane - 20px padding
      const gridWidth = gridSize.width * config.gridSize;
      const gridHeight = gridSize.height * config.gridSize;

      if (gridWidth > containerSize || gridHeight > containerSize) {
        const scaleValue = Math.min(
          containerSize / gridWidth,
          containerSize / gridHeight
        );
        setScale(scaleValue);
      } else {
        setScale(1);
      }
    }
  }, [gridSize, config.gridSize, isAutotile]);

  if (tile.type === "background") {
    if (!tile.spritesheet) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src={tile.src}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      );
    }

    const { src, spritesheet } = tile;
    const scale = Math.min(160 / spritesheet.width, 160 / spritesheet.height);

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
          src={src}
          style={{
            position: "absolute",
            left: -spritesheet.x * scale,
            top: -spritesheet.y * scale,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    );
  }

  // Handle non-autotile case separately to use the enlarged tile logic
  if (!isAutotile) {
    return <>{tilesToRender}</>;
  }

  return (
    <div
      ref={previewContentRef}
      className="autotile-preview-grid"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridSize.width}, ${config.gridSize}px)`,
        gridTemplateRows: `repeat(${gridSize.height}, ${config.gridSize}px)`,
        pointerEvents: "none",
        transform: `scale(${scale})`,
      }}
    >
      {tilesToRender}
    </div>
  );
};
