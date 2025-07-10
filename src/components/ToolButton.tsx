import React from "react";
import { useEditor, Tool } from "../EditorContext";

export interface ToolButtonProps {
  tool?: Tool;
  emoji: string;
  onClick: () => void;
  isSelected?: boolean;
  children?: React.ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  subToolEmoji?: React.ReactNode;
}

export const ToolButton: React.FC<ToolButtonProps> = ({
  tool,
  emoji,
  onClick,
  isSelected,
  children,
  onMouseEnter,
  onMouseLeave,
  subToolEmoji,
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
        {subToolEmoji && (
          <div className="sub-tool-indicator">{subToolEmoji}</div>
        )}
      </button>
      {children}
    </div>
  );
};
