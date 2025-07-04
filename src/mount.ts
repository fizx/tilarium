import React from "react";
import { createRoot, Root } from "react-dom/client";
import { TilemapEditor, TilemapEditorProps } from "./TilemapEditor";

let root: Root | null = null;

/**
 * Mounts the TilemapEditor to a given DOM element.
 * @param element The DOM element or selector string to mount the editor to.
 * @param props The props to pass to the TilemapEditor component.
 * @returns An object with an `unmount` function to clean up the component.
 */
export function mount(
  element: HTMLElement | string,
  props: TilemapEditorProps
) {
  const container =
    typeof element === "string" ? document.querySelector(element) : element;

  if (!container) {
    throw new Error(`Could not find element to mount to: ${element}`);
  }

  root = createRoot(container);
  root.render(React.createElement(TilemapEditor, props));

  return {
    unmount: () => {
      root?.unmount();
      root = null;
    },
  };
}
