import React, { useRef, useEffect } from "react";
import { useEditor } from "../EditorContext";

export const HTML5Canvas = () => {
  const { config, camera, mapBounds } = useEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
