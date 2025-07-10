import React, { useState } from "react";
import { useEditor, Tool } from "../EditorContext";
import { ToolButton } from "./ToolButton";

export interface SubTool {
  name: string;
  emoji: React.ReactNode;
  title: string;
}

interface MultiToolButtonProps {
  tool: Tool;
  emoji: string;
  subTools: SubTool[];
  selectedSubTool: string;
  onSelectSubTool: (name: any) => void;
  subToolIndicator?: React.ReactNode;
}

export const MultiToolButton: React.FC<MultiToolButtonProps> = ({
  tool,
  emoji,
  subTools,
  selectedSubTool,
  onSelectSubTool,
  subToolIndicator,
}) => {
  const { selectedTool, setSelectedTool, setIsMouseOverUI } = useEditor();
  const [isMenuOpen, setMenuOpen] = useState(false);

  const isSelected = selectedTool === tool;

  const handleClick = () => {
    if (isSelected) {
      setMenuOpen(!isMenuOpen);
    } else {
      setSelectedTool(tool);
      setMenuOpen(true);
    }
  };

  return (
    <ToolButton
      tool={tool}
      emoji={emoji}
      onClick={handleClick}
      subToolEmoji={subToolIndicator}
    >
      {isSelected && isMenuOpen && (
        <div className="tool-popout">
          {subTools.map((sub) => (
            <button
              key={sub.name}
              className={`tool-button ${
                selectedSubTool === sub.name ? "selected" : ""
              }`}
              onClick={() => {
                onSelectSubTool(sub.name);
                setMenuOpen(false);
                setIsMouseOverUI(false);
              }}
              title={sub.title}
            >
              {sub.emoji}
            </button>
          ))}
        </div>
      )}
    </ToolButton>
  );
};
