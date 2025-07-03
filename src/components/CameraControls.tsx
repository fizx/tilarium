import React from "react";
import { useEditor } from "../EditorContext";

export const CameraControls = () => {
  const { camera, setCamera } = useEditor();

  const handleZoomIn = () => {
    setCamera({ ...camera, zoom: camera.zoom * 1.2 });
  };

  const handleZoomOut = () => {
    setCamera({ ...camera, zoom: camera.zoom / 1.2 });
  };

  const handleReset = () => {
    setCamera({ x: 0, y: 0, zoom: 1 });
  };

  return (
    <div>
      <button onClick={handleZoomIn}>Zoom In</button>
      <button onClick={handleZoomOut}>Zoom Out</button>
      <button onClick={handleReset}>Reset</button>
    </div>
  );
};
