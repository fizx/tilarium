import React from "react";
import { useEditor, Tool } from "../EditorContext";
import { useState } from "react";

interface ToolButtonProps {
  tool?: Tool;
  emoji: string;
  onClick: () => void;
  isSelected?: boolean;
  children?: React.ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  tool,
  emoji,
  onClick,
  isSelected,
  children,
  onMouseEnter,
  onMouseLeave,
}) => {
  const { selectedTool } = useEditor();
  const isSelectedFinal = isSelected ?? (tool && selectedTool === tool);

  return (
    <div
      className="tool-button-wrapper"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        className={`tool-button ${isSelectedFinal ? "selected" : ""}`}
        onClick={onClick}
      >
        {emoji}
      </button>
      {children}
    </div>
  );
};

export const Toolbar = () => {
  const {
    selectedTool,
    setSelectedTool,
    camera,
    setCamera,
    canvasRef,
    openHelpModal,
    eraseMode,
    setEraseMode,
  } = useEditor();
  const [isEraseMenuOpen, setEraseMenuOpen] = useState(false);

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
        tool="place"
        emoji="🖐️"
        onClick={() => setSelectedTool("place")}
      />
      <ToolButton
        tool="erase"
        emoji="🧼"
        onClick={() => {
          if (selectedTool === "erase") {
            setEraseMenuOpen(!isEraseMenuOpen);
          } else {
            setSelectedTool("erase");
            setEraseMenuOpen(true);
          }
        }}
      >
        {selectedTool === "erase" && isEraseMenuOpen && (
          <div className="tool-popout">
            <button
              className={`tool-button ${
                eraseMode === "single" ? "selected" : ""
              }`}
              onClick={() => setEraseMode("single")}
              title="Single Tile"
            >
              🧼
            </button>
            <button
              className={`tool-button ${
                eraseMode === "wand" ? "selected" : ""
              }`}
              onClick={() => setEraseMode("wand")}
              title="Magic Wand Erase"
            >
              🪄
            </button>
            <button
              className={`tool-button ${
                eraseMode === "rectangle" ? "selected" : ""
              }`}
              onClick={() => setEraseMode("rectangle")}
              title="Rectangle Erase"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M0 2.5A1.5 1.5 0 0 1 1.5 1h11A1.5 1.5 0 0 1 14 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 0 13.5v-11zM1.5 2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-11z" />
              </svg>
            </button>
          </div>
        )}
      </ToolButton>
      <hr />
      <ToolButton emoji="➕" onClick={handleZoomIn} />
      <ToolButton emoji="➖" onClick={handleZoomOut} />
      <hr />
      <ToolButton emoji="❓" onClick={openHelpModal} />
    </div>
  );
};
