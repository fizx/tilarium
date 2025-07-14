import React, { useRef, useEffect, useCallback, useState } from "react";
import { useEditor } from "../EditorContext";
import { PlacedTile } from "../state";

const imageCache = new Map<string, HTMLImageElement>();

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (imageCache.has(src)) {
      resolve(imageCache.get(src)!);
      return;
    }
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

export const HTML5Canvas = () => {
  const {
    config,
    camera,
    mapBounds,
    setCamera,
    selectedTool,
    zoomMode,
    setMouse,
    state,
    applyToolAt,
    placeMode,
    eraseMode,
    selectedTile,
    dispatch,
    setSelectedTile,
    setSelectedTool,
    setHoveredTile,
    hoveredTile,
  } = useEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const pinchDist = useRef(0);
  const justTouched = useRef(false);
  const [areImagesLoaded, setAreImagesLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const allSources = [
      ...new Set(
        Object.values(config.tiles)
          .map((t) => t.src)
          .filter(Boolean)
      ),
    ];
    Promise.all(allSources.map(loadImage)).then(() => {
      setAreImagesLoaded(true);
    });
  }, [config]);

  const getGridCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const gridX = Math.floor(
        (x - camera.x) / (config.gridSize * camera.zoom)
      );
      const gridY = Math.floor(
        (y - camera.y) / (config.gridSize * camera.zoom)
      );
      return { x: gridX, y: gridY };
    },
    [camera, config.gridSize, canvasRef]
  );

  const handleZoomAtPoint = useCallback(
    (zoomFactor: number, pointX: number, pointY: number) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const worldX = (pointX - rect.left - camera.x) / camera.zoom;
      const worldY = (pointY - rect.top - camera.y) / camera.zoom;
      const newZoom = Math.max(0.1, camera.zoom * zoomFactor);
      const newCameraX = pointX - rect.left - worldX * newZoom;
      const newCameraY = pointY - rect.top - worldY * newZoom;

      setCamera({
        zoom: newZoom,
        x: newCameraX,
        y: newCameraY,
      });
    },
    [camera, setCamera, canvasRef]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const { clientX, clientY } = e;

      if (selectedTool === "zoom") {
        const zoomFactor = zoomMode === "in" ? 1.2 : 1 / 1.2;
        handleZoomAtPoint(zoomFactor, clientX, clientY);
        return;
      }

      if (selectedTool === "drag") {
        isDragging.current = true;
        lastMousePosition.current = { x: clientX, y: clientY };
        return;
      }

      if (selectedTool === "eyedropper") {
        if (hoveredTile) {
          const tileDef = config.tiles[hoveredTile.tileId];
          if (tileDef) {
            setSelectedTile({
              definition: tileDef,
              isAutotileRep: !!tileDef.autotile,
            });
            setSelectedTool("place");
          }
        }
        return;
      }

      const coords = getGridCoordinates(clientX, clientY);
      if (!coords) return;

      if (
        (selectedTool === "place" &&
          placeMode === "rectangle" &&
          selectedTile) ||
        (selectedTool === "erase" && eraseMode === "rectangle")
      ) {
        setIsDrawing(true);
        setDrawStart(coords);
        setDrawEnd(coords);
      } else {
        applyToolAt(coords.x, coords.y);
      }
    },
    [selectedTool, zoomMode, handleZoomAtPoint, getGridCoordinates, applyToolAt]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const { clientX, clientY } = e;
      setMouse({ x: clientX, y: clientY });

      const coords = getGridCoordinates(clientX, clientY);
      if (coords) {
        const key = `${coords.x}-${coords.y}`;
        const cell = state.placedTiles.get(key);
        if (cell) {
          const tilesAtLocation = [...cell.values()].filter(
            (t) => t
          ) as PlacedTile[];
          if (tilesAtLocation.length > 0) {
            const topTile = tilesAtLocation.reduce((top, current) => {
              const topZ = config.tiles[top.tileId]?.zIndex ?? -Infinity;
              const currentZ =
                config.tiles[current.tileId]?.zIndex ?? -Infinity;
              return currentZ > topZ ? current : top;
            });
            setHoveredTile(topTile);
          } else {
            setHoveredTile(null);
          }
        } else {
          setHoveredTile(null);
        }
      } else {
        setHoveredTile(null);
      }

      if (isDragging.current) {
        setMouse(null);
        const dx = clientX - lastMousePosition.current.x;
        const dy = clientY - lastMousePosition.current.y;
        setCamera({ ...camera, x: camera.x + dx, y: camera.y + dy });
        lastMousePosition.current = { x: clientX, y: clientY };
      } else if (e.buttons === 1) {
        const coords = getGridCoordinates(clientX, clientY);
        if (coords) {
          if (isDrawing) {
            setDrawEnd(coords);
          } else if (
            (selectedTool === "place" || selectedTool === "erase") &&
            placeMode !== "rectangle" &&
            eraseMode !== "rectangle"
          ) {
            applyToolAt(coords.x, coords.y);
          }
        }
      }
    },
    [
      camera,
      setCamera,
      setMouse,
      getGridCoordinates,
      isDrawing,
      selectedTool,
      placeMode,
      eraseMode,
      applyToolAt,
      state.placedTiles,
      config.tiles,
      setHoveredTile,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawing && drawStart && drawEnd) {
      const startX = Math.min(drawStart.x, drawEnd.x);
      const endX = Math.max(drawStart.x, drawEnd.x);
      const startY = Math.min(drawStart.y, drawEnd.y);
      const endY = Math.max(drawStart.y, drawEnd.y);

      if (
        selectedTool === "place" &&
        placeMode === "rectangle" &&
        selectedTile
      ) {
        dispatch({
          type: "FILL_RECTANGLE",
          payload: {
            startX,
            startY,
            endX,
            endY,
            tileId: selectedTile.definition.displayName,
          },
        });
      } else if (selectedTool === "erase" && eraseMode === "rectangle") {
        dispatch({
          type: "ERASE_RECTANGLE",
          payload: { startX, startY, endX, endY },
        });
      }
    }
    isDragging.current = false;
    setIsDrawing(false);
    setDrawStart(null);
    setDrawEnd(null);
  }, [
    isDrawing,
    drawStart,
    drawEnd,
    dispatch,
    selectedTool,
    placeMode,
    eraseMode,
    selectedTile,
  ]);

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
    setMouse(null);
  }, [setMouse]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      handleZoomAtPoint(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX, e.clientY);
    },
    [handleZoomAtPoint]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Set canvas size
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save context state
      ctx.save();

      // Apply camera transform
      ctx.translate(camera.x, camera.y);
      ctx.scale(camera.zoom, camera.zoom);

      // --- Drawing Grid ---
      const { gridSize } = config;
      const { minX, minY, maxX, maxY } = mapBounds;

      const mapPixelWidth = (maxX - minX + 1) * gridSize;
      const mapPixelHeight = (maxY - minY + 1) * gridSize;
      const mapPixelLeft = minX * gridSize;
      const mapPixelTop = minY * gridSize;

      // Draw map background
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(mapPixelLeft, mapPixelTop, mapPixelWidth, mapPixelHeight);

      // --- Drawing Tiles ---
      if (areImagesLoaded) {
        for (const [cellKey, cell] of state.placedTiles.entries()) {
          const [x, y] = cellKey.split("-").map(Number);
          // Basic culling
          // A more robust implementation would calculate visible bounds
          if (
            x * gridSize >
              -camera.x / camera.zoom + canvas.width / camera.zoom ||
            y * gridSize >
              -camera.y / camera.zoom + canvas.height / camera.zoom ||
            (x + 1) * gridSize < -camera.x / camera.zoom ||
            (y + 1) * gridSize < -camera.y / camera.zoom
          ) {
            continue;
          }

          for (const placedTile of cell.values()) {
            if (!placedTile) continue;

            const tileDef = config.tiles[placedTile.tileId];
            if (!tileDef) continue;

            const image = imageCache.get(tileDef.src);
            if (!image) continue;

            const destX = x * gridSize;
            const destY = y * gridSize;

            if (tileDef.spritesheet) {
              ctx.drawImage(
                image,
                tileDef.spritesheet.x,
                tileDef.spritesheet.y,
                tileDef.spritesheet.width,
                tileDef.spritesheet.height,
                destX,
                destY,
                gridSize,
                gridSize
              );
            } else {
              ctx.drawImage(image, destX, destY, gridSize, gridSize);
            }
          }
        }
      }

      ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
      ctx.lineWidth = 1 / camera.zoom;

      // Vertical lines
      for (let x = 0; x <= mapPixelWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(mapPixelLeft + x, mapPixelTop);
        ctx.lineTo(mapPixelLeft + x, mapPixelTop + mapPixelHeight);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= mapPixelHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(mapPixelLeft, mapPixelTop + y);
        ctx.lineTo(mapPixelLeft + mapPixelWidth, mapPixelTop + y);
        ctx.stroke();
      }

      // Restore context state
      ctx.restore();

      // --- Draw Selection Rectangle ---
      if (isDrawing && drawStart && drawEnd) {
        const startX = Math.min(drawStart.x, drawEnd.x);
        const endX = Math.max(drawStart.x, drawEnd.x);
        const startY = Math.min(drawStart.y, drawEnd.y);
        const endY = Math.max(drawStart.y, drawEnd.y);

        const rectX = startX * config.gridSize * camera.zoom + camera.x;
        const rectY = startY * config.gridSize * camera.zoom + camera.y;
        const rectW = (endX - startX + 1) * config.gridSize * camera.zoom;
        const rectH = (endY - startY + 1) * config.gridSize * camera.zoom;

        ctx.fillStyle =
          selectedTool === "place"
            ? "rgba(52, 152, 219, 0.2)"
            : "rgba(231, 76, 60, 0.2)";
        ctx.strokeStyle =
          selectedTool === "place"
            ? "rgba(52, 152, 219, 0.8)"
            : "rgba(231, 76, 60, 0.8)";
        ctx.lineWidth = 2;

        ctx.fillRect(rectX, rectY, rectW, rectH);
        ctx.strokeRect(rectX, rectY, rectW, rectH);
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [
    camera,
    config,
    mapBounds,
    state.placedTiles,
    areImagesLoaded,
    isDrawing,
    drawStart,
    drawEnd,
    selectedTool,
    placeMode,
    eraseMode,
    dispatch,
  ]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    />
  );
};
