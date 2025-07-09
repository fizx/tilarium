import React, { useMemo, useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "../EditorContext";
import { Tile } from "./Tile";
import { TileDefinition } from "../config";
import { AutotilePreview } from "./AutotilePreview";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canTabsScrollLeft, setCanTabsScrollLeft] = useState(false);
  const [canTabsScrollRight, setCanTabsScrollRight] = useState(false);
  const [preview, setPreview] = useState<{
    tile: TileDefinition;
    rect: DOMRect;
    isAutotile: boolean;
  } | null>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  const tileGroups = useMemo(() => {
    return Object.values(config.groups).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }, [config.groups]);

  useEffect(() => {
    // if the active tab is not in the tile groups, set it to the first one
    if (
      !tileGroups.find((group) => group.displayName === activeTab) &&
      tileGroups.length > 0
    ) {
      setActiveTab(tileGroups[0].displayName);
    }
  }, [tileGroups, activeTab]);

  useEffect(() => {
    const checkScroll = () => {
      const el = scrollContainerRef.current;
      if (el) {
        const { scrollLeft, scrollWidth, clientWidth } = el;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
      }
    };

    const el = scrollContainerRef.current;
    if (el) {
      checkScroll();
      el.addEventListener("scroll", checkScroll);
      // listen for resize
      window.addEventListener("resize", checkScroll);
    }

    // Also check when the active tab changes
    checkScroll();

    return () => {
      if (el) {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      }
    };
  }, [activeTab]);

  useEffect(() => {
    const checkTabsScroll = () => {
      const el = tabsScrollRef.current;
      if (el) {
        const { scrollLeft, scrollWidth, clientWidth } = el;
        setCanTabsScrollLeft(scrollLeft > 0);
        setCanTabsScrollRight(scrollLeft < scrollWidth - clientWidth - 1); // -1 for subpixel rendering
      }
    };

    const el = tabsScrollRef.current;
    if (el) {
      checkTabsScroll();
      el.addEventListener("scroll", checkTabsScroll);
      window.addEventListener("resize", checkTabsScroll);
    }

    return () => {
      if (el) {
        el.removeEventListener("scroll", checkTabsScroll);
        window.removeEventListener("resize", checkTabsScroll);
      }
    };
  }, [tileGroups]);

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
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsScrollRef.current) {
      const scrollAmount = direction === "left" ? -150 : 150;
      tabsScrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div
      className="palette"
      ref={paletteRef}
      onMouseLeave={() => {
        setPreview(null);
      }}
    >
      <div className="tabs-container">
        {canTabsScrollLeft && (
          <div
            className="scroll-button-tabs left"
            onClick={() => scrollTabs("left")}
          >
            ❮
          </div>
        )}
        <div className="tabs" ref={tabsScrollRef}>
          {tileGroups.map((group) => (
            <button
              key={group.displayName}
              className={`tab-button ${
                activeTab === group.displayName ? "active" : ""
              }`}
              onClick={(e) => {
                setActiveTab(group.displayName);
                e.currentTarget.scrollIntoView({
                  behavior: "smooth",
                  inline: "center",
                  block: "nearest",
                });
              }}
            >
              {group.displayName}
            </button>
          ))}
        </div>
        {canTabsScrollRight && (
          <div
            className="scroll-button-tabs right"
            onClick={() => scrollTabs("right")}
          >
            ❯
          </div>
        )}
      </div>
      <div className="tab-content">
        {tileGroups.map((group) => {
          if (activeTab === group.displayName) {
            return (
              <div key={group.displayName} className="carousel-container">
                {canScrollLeft && (
                  <div
                    className="scroll-button left"
                    onClick={() => scroll("left")}
                  >
                    ❮
                  </div>
                )}
                <div
                  className={`tile-grid ${
                    group.displayName === "backgrounds"
                      ? "backgrounds-grid"
                      : ""
                  }`}
                  ref={scrollContainerRef}
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
                            t.autotile && hasAllDirections(t.autotile.neighbors)
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

                    // 2. Get all other tiles for the tab
                    const allOtherTiles = group.tileIds.map((tileId) => ({
                      tile: config.tiles[tileId],
                      isAutotileRep: false,
                    }));

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
                            if (paletteRef.current) {
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
                {canScrollRight && (
                  <div
                    className="scroll-button right"
                    onClick={() => scroll("right")}
                  >
                    ❯
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
      {(() => {
        const shouldShowPreview =
          preview || (selectedTool === "place" && selectedTile);

        if (!shouldShowPreview) return null;

        let tileForPreview: TileDefinition;
        let isAutotileForPreview: boolean;
        let rectForPreview: DOMRect | undefined;

        if (preview) {
          tileForPreview = preview.tile;
          isAutotileForPreview = preview.isAutotile;
          rectForPreview = preview.rect;
        } else if (selectedTool === "place" && selectedTile) {
          tileForPreview = selectedTile.definition;
          isAutotileForPreview = selectedTile.isAutotileRep;
          rectForPreview = paletteRef.current?.getBoundingClientRect();
        } else {
          return null;
        }

        if (!rectForPreview) return null;

        return ReactDOM.createPortal(
          <div
            className="autotile-preview-container"
            style={{
              position: "fixed",
              top: `${rectForPreview.top - 10}px`,
              left: `${rectForPreview.left}px`,
              transform: "translateY(-100%)",
              zIndex: 1000,
              backgroundColor: "#fdfdfd",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "5px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
          >
            <AutotilePreview
              tile={tileForPreview}
              isAutotile={isAutotileForPreview}
            />
          </div>,
          document.body
        );
      })()}
    </div>
  );
};
