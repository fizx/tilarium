import React from "react";
import { useEditor, Tool } from "../EditorContext";

interface ToolButtonProps {
  tool?: Tool;
  emoji: string;
  onClick: () => void;
  isSelected?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  tool,
  emoji,
  onClick,
  isSelected,
}) => {
  const { selectedTool } = useEditor();
  const isSelectedFinal = isSelected ?? (tool && selectedTool === tool);

  return (
    <button
      className={`tool-button ${isSelectedFinal ? "selected" : ""}`}
      onClick={onClick}
    >
      {emoji}
    </button>
  );
};

export const Toolbar = () => {
  const { setSelectedTool, camera, setCamera, canvasRef } = useEditor();

  const handleZoom = (zoomFactor: number) => {
    if (!canvasRef?.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const worldX = (centerX - camera.x) / camera.zoom;
    const worldY = (centerY - camera.y) / camera.zoom;

    const newZoom = Math.max(0.1, camera.zoom * zoomFactor);

    const newCameraX = centerX - worldX * newZoom;
    const newCameraY = centerY - worldY * newZoom;

    setCamera({
      zoom: newZoom,
      x: newCameraX,
      y: newCameraY,
    });
  };

  const handleZoomIn = () => handleZoom(1.2);
  const handleZoomOut = () => handleZoom(1 / 1.2);

  return (
    <div className="toolbar">
      <ToolButton
        tool="drag"
        emoji="🖐️"
        onClick={() => setSelectedTool("drag")}
      />
      <ToolButton
        tool="erase"
        emoji="🧼"
        onClick={() => setSelectedTool("erase")}
      />
      <ToolButton
        tool="eyedropper"
        emoji="💧"
        onClick={() => setSelectedTool("eyedropper")}
      />
      <hr />
      <ToolButton emoji="➕" onClick={handleZoomIn} />
      <ToolButton emoji="➖" onClick={handleZoomOut} />
    </div>
  );
};
