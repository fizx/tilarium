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
  const { setSelectedTool, camera, setCamera } = useEditor();

  const handleZoomIn = () => {
    setCamera({ ...camera, zoom: camera.zoom * 1.2 });
  };

  const handleZoomOut = () => {
    setCamera({ ...camera, zoom: camera.zoom / 1.2 });
  };

  return (
    <div className="toolbar">
      <ToolButton
        tool="pointer"
        emoji="🖐️"
        onClick={() => setSelectedTool("pointer")}
      />
      <ToolButton
        tool="erase"
        emoji="🧼"
        onClick={() => setSelectedTool("erase")}
      />
      <ToolButton
        tool="magic-wand"
        emoji="✨"
        onClick={() => setSelectedTool("magic-wand")}
      />
      <hr />
      <ToolButton emoji="➕" onClick={handleZoomIn} />
      <ToolButton emoji="➖" onClick={handleZoomOut} />
    </div>
  );
};
