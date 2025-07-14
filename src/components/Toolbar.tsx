import React from "react";
import { useEditor } from "../EditorContext";
import { ToolButton } from "./ToolButton";
import { MultiToolButton } from "./MultiToolButton";

const getEmojiForEraseMode = (
  eraseMode: "single" | "wand" | "rectangle"
): React.ReactNode => {
  switch (eraseMode) {
    case "wand":
      return "🪄";
    case "rectangle":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M0 2.5A1.5 1.5 0 0 1 1.5 1h11A1.5 1.5 0 0 1 14 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 0 13.5v-11zM1.5 2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-11z" />
        </svg>
      );
    case "single":
    default:
      return null;
  }
};

const getEmojiForZoomMode = (zoomMode: "in" | "out"): React.ReactNode => {
  switch (zoomMode) {
    case "in":
      return "➕";
    case "out":
      return "➖";
    default:
      return null;
  }
};

export const Toolbar = () => {
  const {
    setSelectedTool,
    openHelpModal,
    eraseMode,
    setEraseMode,
    zoomMode,
    setZoomMode,
    setIsMouseOverUI,
  } = useEditor();

  const eraseSubTools = [
    { name: "single", emoji: "🧼", title: "Single Tile" },
    { name: "wand", emoji: "🪄", title: "Magic Wand Erase" },
    {
      name: "rectangle",
      emoji: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M0 2.5A1.5 1.5 0 0 1 1.5 1h11A1.5 1.5 0 0 1 14 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 0 13.5v-11zM1.5 2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-11z" />
        </svg>
      ),
      title: "Rectangle Erase",
    },
  ];

  const zoomSubTools = [
    { name: "in", emoji: "➕", title: "Zoom In" },
    { name: "out", emoji: "➖", title: "Zoom Out" },
  ];

  return (
    <div
      className="toolbar"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setIsMouseOverUI(true)}
      onMouseLeave={() => setIsMouseOverUI(false)}
    >
      <ToolButton
        tool="drag"
        emoji="🖐️"
        onClick={() => setSelectedTool("drag")}
      />
      <MultiToolButton
        tool="erase"
        emoji="🧼"
        subTools={eraseSubTools}
        selectedSubTool={eraseMode}
        onSelectSubTool={setEraseMode}
        subToolIndicator={getEmojiForEraseMode(eraseMode)}
      />
      <ToolButton
        tool="eyedropper"
        emoji="💧"
        onClick={() => setSelectedTool("eyedropper")}
      />
      <hr />
      <MultiToolButton
        tool="zoom"
        emoji="🔍"
        subTools={zoomSubTools}
        selectedSubTool={zoomMode}
        onSelectSubTool={setZoomMode}
        subToolIndicator={getEmojiForZoomMode(zoomMode)}
      />
      <hr />
      <ToolButton emoji="❓" onClick={openHelpModal} />
    </div>
  );
};
