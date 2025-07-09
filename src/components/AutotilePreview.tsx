import React, { useMemo } from "react";
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
      // Non-autotile logic
      const rendered = [
        <div key="0-0" style={{ gridColumn: 1, gridRow: 1 }}>
          <Tile tile={{ ...tile, source: "local" }} />
        </div>,
      ];
      return { tilesToRender: rendered, gridSize: { width: 1, height: 1 } };
    }
  }, [isAutotile, autotileGroup, tile, config, autotileLookup, previewSizes]);

  return (
    <div
      className="autotile-preview-grid"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridSize.width}, ${config.gridSize}px)`,
        gridTemplateRows: `repeat(${gridSize.height}, ${config.gridSize}px)`,
        pointerEvents: "none",
      }}
    >
      {tilesToRender}
    </div>
  );
};
