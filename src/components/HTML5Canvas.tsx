import React, { useRef, useEffect, useCallback, useState } from "react";
import { useEditor } from "../EditorContext";

export const HTML5Canvas = () => {
  const {
    config,
    camera,
    mapBounds,
    setCamera,
    selectedTool,
    zoomMode,
    setMouse,
  } = useEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const pinchDist = useRef(0);
  const justTouched = useRef(false);

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
    },
    [selectedTool, zoomMode, handleZoomAtPoint]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const { clientX, clientY } = e;
      setMouse({ x: clientX, y: clientY });

      if (isDragging.current) {
        setMouse(null);
        const dx = clientX - lastMousePosition.current.x;
        const dy = clientY - lastMousePosition.current.y;
        setCamera({ ...camera, x: camera.x + dx, y: camera.y + dy });
        lastMousePosition.current = { x: clientX, y: clientY };
      }
    },
    [camera, setCamera, setMouse]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

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

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [camera, config, mapBounds]);

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
