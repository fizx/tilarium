import React, {
  useRef,
  useState,
  useMemo,
  TouchEvent,
  MouseEvent,
  useEffect,
} from "react";
import { useEditor } from "../EditorContext";
import { Tile } from "./Tile";
import { Background } from "./Background";

export const Canvas = () => {
  const {
    config,
    state,
    dispatch,
    selectedTile,
    selectedTool,
    camera,
    setCamera,
    canvasRef,
    setMouse,
    setTileToReplace,
  } = useEditor();
  const [isDragging, setIsDragging] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const lastPaintedCell = useRef<{ x: number; y: number } | null>(null);
  const pinchDist = useRef(0);

  const cursor = useMemo(() => {
    if (isDragging || isPainting) {
      return "grabbing";
    }

    switch (selectedTool) {
      case "drag":
        return "grab";
      case "erase":
      case "place":
        return "none";
      case "magic-wand":
        return "pointer";
      default:
        return "default";
    }
  }, [selectedTool, isDragging, isPainting]);

  const applyToolAt = (gridX: number, gridY: number) => {
    if (
      lastPaintedCell.current?.x === gridX &&
      lastPaintedCell.current?.y === gridY
    ) {
      return;
    }

    if (selectedTool === "place" && selectedTile) {
      dispatch({
        type: "ADD_TILE",
        payload: { x: gridX, y: gridY, tileId: selectedTile.displayName },
      });
    } else if (selectedTool === "erase") {
      dispatch({ type: "REMOVE_TILE", payload: { x: gridX, y: gridY } });
    }

    lastPaintedCell.current = { x: gridX, y: gridY };
  };

  const getEventCoords = (e: MouseEvent | TouchEvent) => {
    if ("touches" in e) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const handlePanStart = (e: MouseEvent | TouchEvent) => {
    if ("touches" in e && e.touches.length > 1) {
      return;
    }
    if (selectedTool === "drag") {
      setIsDragging(true);
      const { clientX, clientY } = getEventCoords(e);
      lastMousePosition.current = { x: clientX, y: clientY };
    }
  };

  const handlePaintStart = (e: MouseEvent | TouchEvent) => {
    if ("touches" in e && e.touches.length > 1) {
      return;
    }
    if (selectedTool === "place" || selectedTool === "erase") {
      setIsPainting(true);
      const { clientX, clientY } = getEventCoords(e);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = Math.floor(
        (clientX - rect.left - camera.x) / (config.gridSize * camera.zoom)
      );
      const y = Math.floor(
        (clientY - rect.top - camera.y) / (config.gridSize * camera.zoom)
      );
      applyToolAt(x, y);
    }
  };

  const handleInteractionEnd = () => {
    setIsDragging(false);
    setIsPainting(false);
    lastPaintedCell.current = null;
    pinchDist.current = 0;
  };

  const handleInteractionMove = (e: MouseEvent | TouchEvent) => {
    const { clientX, clientY } = getEventCoords(e);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const gridX = Math.floor(
      (clientX - rect.left - camera.x) / (config.gridSize * camera.zoom)
    );
    const gridY = Math.floor(
      (clientY - rect.top - camera.y) / (config.gridSize * camera.zoom)
    );

    const snappedX =
      gridX * (config.gridSize * camera.zoom) + camera.x + rect.left;
    const snappedY =
      gridY * (config.gridSize * camera.zoom) + camera.y + rect.top;

    setMouse({ x: snappedX, y: snappedY });

    if (isPainting) {
      applyToolAt(gridX, gridY);
      return;
    }

    if (isDragging && selectedTool === "drag") {
      setMouse(null);
      const dx = clientX - lastMousePosition.current.x;
      const dy = clientY - lastMousePosition.current.y;
      setCamera({ ...camera, x: camera.x + dx, y: camera.y + dy });
      lastMousePosition.current = { x: clientX, y: clientY };
    } else {
      if (selectedTool === "place" && selectedTile) {
        const tileToReplace =
          state.placedTiles.find((pt) => {
            const existingTileDef = config.tiles[pt.tileId];
            return (
              pt.x === gridX &&
              pt.y === gridY &&
              existingTileDef?.zIndex === selectedTile.zIndex
            );
          }) || null;
        setTileToReplace(tileToReplace);
      } else {
        setTileToReplace(null);
      }
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    handlePanStart(e);
    handlePaintStart(e);
  };

  const handleMouseUp = () => {
    handleInteractionEnd();
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleInteractionMove(e);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      // pinch
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDist.current = Math.sqrt(dx * dx + dy * dy);
    } else {
      handlePanStart(e);
      handlePaintStart(e);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      // pinch
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newPinchDist = Math.sqrt(dx * dx + dy * dy);
      const delta = newPinchDist - pinchDist.current;
      pinchDist.current = newPinchDist;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

      const c1 = {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
      const c2 = {
        x: e.touches[1].clientX - rect.left,
        y: e.touches[1].clientY - rect.top,
      };

      const midX = (c1.x + c2.x) / 2;
      const midY = (c1.y + c2.y) / 2;

      const worldX = (midX - camera.x) / camera.zoom;
      const worldY = (midY - camera.y) / camera.zoom;

      const newZoom = Math.max(0.1, camera.zoom + delta * 0.01);

      const newCameraX = midX - worldX * newZoom;
      const newCameraY = midY - worldY * newZoom;

      setCamera({
        zoom: newZoom,
        x: newCameraX,
        y: newCameraY,
      });
    } else {
      handleInteractionMove(e);
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    handleInteractionEnd();
  };

  const handleMouseEnter = (e: MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsPainting(false);
    lastPaintedCell.current = null;
    setMouse(null);
    setTileToReplace(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - camera.x) / camera.zoom;
    const worldY = (mouseY - camera.y) / camera.zoom;

    const newZoom = Math.max(0.1, camera.zoom - e.deltaY * 0.001);

    const newCameraX = mouseX - worldX * newZoom;
    const newCameraY = mouseY - worldY * newZoom;

    setCamera({
      zoom: newZoom,
      x: newCameraX,
      y: newCameraY,
    });
  };

  const mapSize =
    config.mapSize === "infinite"
      ? null
      : {
          width: config.mapSize.width * config.gridSize,
          height: config.mapSize.height * config.gridSize,
        };

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const options = { passive: false };

    const handleTouchStartNative = handleTouchStart as unknown as EventListener;
    const handleTouchMoveNative = handleTouchMove as unknown as EventListener;
    const handleTouchEndNative = handleTouchEnd as unknown as EventListener;
    const handleWheelNative = handleWheel as unknown as EventListener;

    canvasElement.addEventListener(
      "touchstart",
      handleTouchStartNative,
      options
    );
    canvasElement.addEventListener("touchmove", handleTouchMoveNative, options);
    canvasElement.addEventListener("touchend", handleTouchEndNative, options);
    canvasElement.addEventListener("wheel", handleWheelNative, options);

    return () => {
      canvasElement.removeEventListener("touchstart", handleTouchStartNative);
      canvasElement.removeEventListener("touchmove", handleTouchMoveNative);
      canvasElement.removeEventListener("touchend", handleTouchEndNative);
      canvasElement.removeEventListener("wheel", handleWheelNative);
    };
  }, [
    canvasRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
  ]);

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="canvas-container"
      style={{ cursor }}
    >
      <div
        className="transform-container"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: "top left",
          width: mapSize ? "max-content" : "100%",
          height: mapSize ? "max-content" : "100%",
        }}
      >
        <div
          className="map-boundary"
          style={
            mapSize
              ? {
                  ...mapSize,
                  position: "relative",
                  backgroundColor: "#f0f0f0",
                }
              : {
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  backgroundColor: "#f0f0f0",
                }
          }
        >
          <div
            className="background-container"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 1,
            }}
          >
            <Background mapSize={mapSize} />
          </div>
          <div
            className="grid-container"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)`,
              backgroundSize: `${config.gridSize}px ${config.gridSize}px`,
              zIndex: 2,
            }}
          />
          <div
            className="tile-container"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 3,
            }}
          >
            {state.placedTiles
              .filter(
                (placedTile) =>
                  config.tiles[placedTile.tileId]?.type === "tile" &&
                  !(
                    placedTile.x === state.tileToReplace?.x &&
                    placedTile.y === state.tileToReplace?.y &&
                    placedTile.tileId === state.tileToReplace?.tileId
                  )
              )
              .map((placedTile) => {
                const tileDef = config.tiles[placedTile.tileId];
                if (!tileDef) return null;
                return (
                  <div
                    key={`${placedTile.x}-${placedTile.y}-${placedTile.tileId}`}
                    style={{
                      position: "absolute",
                      left: placedTile.x * config.gridSize,
                      top: placedTile.y * config.gridSize,
                      zIndex: tileDef.zIndex,
                    }}
                  >
                    <Tile tile={tileDef} />
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
