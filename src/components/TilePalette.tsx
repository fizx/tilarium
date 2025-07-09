import React, { useMemo, useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "../EditorContext";
import { Tile } from "./Tile";
import { TileDefinition } from "../config";
import { AutotilePreview } from "./AutotilePreview";
import { PreviewPlaceholder } from "./PreviewPlaceholder";
import { ScrollableContainer } from "./ScrollableContainer";

export const TilePalette = ({
  onSelectTile,
}: {
  onSelectTile: (tile: TileDefinition, isAutotileRep: boolean) => void;
}) => {
  const {
    config,
    selectedTile,
    setSelectedTile,
    setSelectedTool,
    selectedTool,
  } = useEditor();
  const [activeTab, setActiveTab] = useState(
    Object.values(config.groups).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    )[0]?.displayName || ""
  );
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<{
    tile: TileDefinition;
    rect: DOMRect;
    isAutotile: boolean;
  } | null>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const [flashingGroup, setFlashingGroup] = useState<string | null>(null);
  const [autotileGroupToShow, setAutotileGroupToShow] = useState<string | null>(
    null
  );
  const [variantMode, setVariantMode] = useState<"auto" | "manual">("auto");
  const [isPreviewVisible, setIsPreviewVisible] = useState(
    () => window.matchMedia("(min-width: 501px)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 501px)");
    const handler = (e: MediaQueryListEvent) => setIsPreviewVisible(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const tileGroups = useMemo(() => {
    return Object.values(config.groups).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }, [config.groups]);

  const tabButtonRefs = useMemo(
    () =>
      new Map(
        tileGroups.map((g) => [
          g.displayName,
          React.createRef<HTMLButtonElement>(),
        ])
      ),
    [tileGroups]
  );

  const groupRefs = useMemo(
    () =>
      new Map(
        tileGroups.map((g) => [
          g.displayName,
          React.createRef<HTMLDivElement>(),
        ])
      ),
    [tileGroups]
  );

  const showVariantButton = useMemo(
    () =>
      selectedTool === "place" &&
      selectedTile &&
      selectedTile.isAutotileRep &&
      selectedTile.definition.autotile &&
      (!preview ||
        preview.tile.displayName === selectedTile.definition.displayName),
    [selectedTool, selectedTile, preview]
  );

  useEffect(() => {
    if (!showVariantButton) {
      setVariantMode("auto");
    }
  }, [showVariantButton]);

  useEffect(() => {
    // This effect now only handles *opening* the drawer when switching to manual mode.
    // Closing the drawer is handled by direct onClick events.
    if (variantMode === "manual" && selectedTile?.definition.autotile) {
      setAutotileGroupToShow(selectedTile.definition.autotile.group);
    }
  }, [variantMode, selectedTile]);

  useEffect(() => {
    // if the active tab is not in the tile groups, set it to the first one
    if (
      !tileGroups.find((group) => group.displayName === activeTab) &&
      tileGroups.length > 0
    ) {
      setActiveTab(tileGroups[0].displayName);
    }
  }, [tileGroups, activeTab]);

  const handleSelectTile = (
    e: React.MouseEvent<HTMLDivElement>,
    tile: TileDefinition,
    groupName: string,
    isAutotileRep: boolean
  ) => {
    e.currentTarget.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
    onSelectTile(tile, isAutotileRep);
    if (groupName !== "backgrounds") {
      setSelectedTool("place");
    }
    setVariantMode("auto"); // Always reset to auto mode when selecting a new tile.

    // If preview is hidden, open drawer immediately for autotiles.
    if (!isPreviewVisible && isAutotileRep && tile.autotile) {
      setAutotileGroupToShow(tile.autotile.group);
      setVariantMode("manual");
    }
  };

  const renderPreview = () => {
    const shouldShowPreview =
      preview || (selectedTool === "place" && selectedTile);

    if (!shouldShowPreview) {
      return <PreviewPlaceholder />;
    }

    let tileForPreview: TileDefinition;
    let isAutotileForPreview: boolean;

    if (preview) {
      tileForPreview = preview.tile;
      isAutotileForPreview = preview.isAutotile;
    } else if (selectedTool === "place" && selectedTile) {
      tileForPreview = selectedTile.definition;
      isAutotileForPreview = selectedTile.isAutotileRep;
    } else {
      return <PreviewPlaceholder />;
    }

    return (
      <>
        <div className="preview-container">
          <AutotilePreview
            tile={tileForPreview}
            isAutotile={isAutotileForPreview}
          />
        </div>
        {showVariantButton && (
          <div className="variants-toggle-set">
            <button
              className={`toggle-button ${
                variantMode === "manual" ? "active" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setVariantMode("manual");
              }}
              title="Variants"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z" />
              </svg>
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className="palette"
      ref={paletteRef}
      onClick={(e) => {
        // Clicks on the palette itself (but not its children) should close the drawer
        if (e.target === paletteRef.current && autotileGroupToShow) {
          setAutotileGroupToShow(null);
          setVariantMode("auto");
        }
      }}
    >
      <div
        className="preview-pane"
        onClick={() => {
          if (autotileGroupToShow) {
            setAutotileGroupToShow(null);
            setVariantMode("auto");
          }
        }}
      >
        {renderPreview()}
      </div>
      <div
        className="main-pane"
        onMouseLeave={() => {
          setPreview(null);
        }}
      >
        <div className="tabs-container">
          <ScrollableContainer>
            {tileGroups.map((group) => (
              <button
                key={group.displayName}
                ref={tabButtonRefs.get(group.displayName)}
                className={`tab-button ${
                  activeTab === group.displayName ? "active" : ""
                }`}
                onClick={(e) => {
                  setActiveTab(group.displayName);
                  setFlashingGroup(group.displayName);
                  setTimeout(() => setFlashingGroup(null), 1000); // Duration of the flash animation
                  e.currentTarget.scrollIntoView({
                    behavior: "smooth",
                    inline: "center",
                  });
                  const groupRef = groupRefs.get(group.displayName);
                  if (groupRef?.current) {
                    groupRef.current.scrollIntoView({
                      behavior: "smooth",
                      inline: "start",
                      block: "nearest",
                    });
                  }
                }}
              >
                {group.displayName}
              </button>
            ))}
          </ScrollableContainer>
        </div>
        <div className="tab-content">
          <ScrollableContainer>
            <div className="tile-grid-content">
              {tileGroups.map((group) => (
                <div
                  key={group.displayName}
                  className="tile-group-wrapper"
                  ref={groupRefs.get(group.displayName)}
                  data-group-name={group.displayName}
                >
                  {flashingGroup === group.displayName && (
                    <div className="flash-overlay"></div>
                  )}
                  <div
                    className={`tile-sub-grid ${
                      group.displayName === "backgrounds"
                        ? "backgrounds-grid"
                        : ""
                    }`}
                  >
                    {(() => {
                      const getRepTile = (
                        groupName: string,
                        allTiles: TileDefinition[]
                      ) => {
                        // Priority 1: No suffix (exact match)
                        let repTile = allTiles.find(
                          (t) => t.displayName === groupName
                        );

                        // Priority 2: Full cover/middle/NESW
                        if (!repTile) {
                          const hasAllDirections = (s: string) =>
                            s.includes("N") &&
                            s.includes("E") &&
                            s.includes("S") &&
                            s.includes("W");
                          repTile = allTiles.find(
                            (t) =>
                              t.autotile &&
                              hasAllDirections(t.autotile.neighbors)
                          );
                        }

                        // Priority 3: Any as a fallback
                        if (!repTile) {
                          repTile = allTiles[0];
                        }
                        return repTile;
                      };

                      // 1. Get representatives for each autotile group
                      const autotileRepTiles = (group.autotileGroups || []).map(
                        (ag) => {
                          const tilesForThisGroup = Object.values(
                            config.tiles
                          ).filter((t) => t.autotile?.group === ag);
                          return {
                            tile: getRepTile(ag, tilesForThisGroup),
                            isAutotileRep: true,
                          };
                        }
                      );

                      // 2. Get all other tiles for the tab, filtering out autotile members
                      const allOtherTiles = group.tileIds
                        .map((tileId) => ({
                          tile: config.tiles[tileId],
                          isAutotileRep: false,
                        }))
                        .filter(({ tile }) => !tile.autotile);

                      // 3. Combine and de-duplicate, with representatives taking precedence
                      const displayTiles = [
                        ...autotileRepTiles,
                        ...allOtherTiles,
                      ].filter(
                        (item, index, self) =>
                          item.tile &&
                          self.findIndex(
                            (t) => t.tile.displayName === item.tile.displayName
                          ) === index
                      );

                      // 4. Render
                      return displayTiles.map(({ tile, isAutotileRep }) => {
                        if (!tile) return null;

                        const isSelected =
                          selectedTool === "place" &&
                          selectedTile?.definition.displayName ===
                            tile.displayName;

                        const wrapperClassName = [
                          "tile-wrapper",
                          isSelected ? "selected" : "",
                          isAutotileRep ? "autotile-glow" : "",
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <div
                            key={tile.displayName}
                            className={wrapperClassName}
                            onClick={(e) =>
                              handleSelectTile(
                                e,
                                tile,
                                group.displayName,
                                isAutotileRep
                              )
                            }
                            onMouseEnter={() => {
                              if (!selectedTile && paletteRef.current) {
                                setPreview({
                                  tile: tile,
                                  rect: paletteRef.current.getBoundingClientRect(),
                                  isAutotile: isAutotileRep,
                                });
                              }
                            }}
                            title={tile.displayName}
                          >
                            <div className="tile-image-wrapper">
                              <Tile tile={{ ...tile, source: "local" }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </ScrollableContainer>
          {autotileGroupToShow && (
            <div
              className={`variant-drawer-overlay ${
                autotileGroupToShow ? "visible" : ""
              }`}
              onClick={() => {
                setAutotileGroupToShow(null);
                setVariantMode("auto");
              }}
            >
              <div
                className="variant-drawer"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="variant-drawer-actions">
                  <button
                    className={`tool-button ${
                      variantMode === "auto" ? "active" : ""
                    }`}
                    onClick={() => {
                      if (selectedTile?.definition.autotile) {
                        const groupName =
                          selectedTile.definition.autotile.group;
                        const tilesForThisGroup = Object.values(
                          config.tiles
                        ).filter((t) => t.autotile?.group === groupName);

                        // Find representative tile using the same logic as the initial palette load
                        let repTile = tilesForThisGroup.find(
                          (t) => t.displayName === groupName
                        );
                        if (!repTile) {
                          const hasAllDirections = (s: string) =>
                            ["N", "E", "S", "W"].every((d) => s.includes(d));
                          repTile = tilesForThisGroup.find(
                            (t) =>
                              t.autotile &&
                              hasAllDirections(t.autotile.neighbors)
                          );
                        }
                        if (!repTile && tilesForThisGroup.length > 0) {
                          repTile = tilesForThisGroup[0];
                        }

                        if (repTile) {
                          onSelectTile(repTile, true);
                        }
                      }
                      setVariantMode("auto");
                    }}
                    title="Autotile"
                  >
                    🪄
                  </button>
                  <button
                    className="tool-button close-button"
                    onClick={() => {
                      setAutotileGroupToShow(null);
                      setVariantMode("auto");
                    }}
                    title="Close"
                  >
                    ❌
                  </button>
                </div>
                <div className="variant-drawer-separator" />
                <ScrollableContainer>
                  <div className="tile-grid">
                    {Object.values(config.tiles)
                      .filter((t) => t.autotile?.group === autotileGroupToShow)
                      .map((tile) => (
                        <div
                          key={tile.displayName}
                          className="tile-wrapper"
                          onClick={(e) => {
                            onSelectTile(tile, false);
                            setSelectedTool("place");
                            setVariantMode("manual");
                          }}
                          title={tile.displayName}
                        >
                          <Tile tile={{ ...tile, source: "local" }} />
                        </div>
                      ))}
                  </div>
                </ScrollableContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
