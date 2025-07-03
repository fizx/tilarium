import React from "react";
import { useEditor, Tool } from "../EditorContext";

interface ToolButtonProps {
  tool: Tool;
  emoji: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ tool, emoji }) => {
  const { selectedTool, setSelectedTool } = useEditor();

  return (
    <button
      className={`tool-button ${selectedTool === tool ? "selected" : ""}`}
      onClick={() => setSelectedTool(tool)}
    >
      {emoji}
    </button>
  );
};

export const Toolbar = () => {
  return (
    <div className="toolbar">
      <ToolButton tool="pointer" emoji="👆" />
      <ToolButton tool="erase" emoji="🧼" />
      <ToolButton tool="magic-wand" emoji="✨" />
    </div>
  );
};
