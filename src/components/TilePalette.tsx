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
  const [showAllVariants, setShowAllVariants] = useState(false);
  const [flashingGroup, setFlashingGroup] = useState<string | null>(null);

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
      window.addEventListener("resize", checkScroll);
    }

    return () => {
      if (el) {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      }
    };
  }, []); // Now depends on the single container, not activeTab

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

  const renderPreview = () => {
    const shouldShowPreview =
      preview || (selectedTool === "place" && selectedTile);

    if (!shouldShowPreview) return null;

    let tileForPreview: TileDefinition;
    let isAutotileForPreview: boolean;

    if (preview) {
      tileForPreview = preview.tile;
      isAutotileForPreview = preview.isAutotile;
    } else if (selectedTool === "place" && selectedTile) {
      tileForPreview = selectedTile.definition;
      isAutotileForPreview = selectedTile.isAutotileRep;
    } else {
      return null;
    }

    return (
      <AutotilePreview
        tile={tileForPreview}
        isAutotile={isAutotileForPreview}
      />
    );
  };

  return (
    <div
      className="palette"
      ref={paletteRef}
      onMouseLeave={() => {
        setPreview(null);
      }}
    >
      <div className="preview-pane">{renderPreview()}</div>
      <div className="main-pane">
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
                      inline: "center",
                      block: "nearest",
                    });
                  }
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
          <div className="show-all-variants-toggle">
            <input
              type="checkbox"
              id="show-all-variants"
              checked={showAllVariants}
              onChange={(e) => setShowAllVariants(e.target.checked)}
            />
            <label htmlFor="show-all-variants">Show Variants</label>
          </div>
        </div>
        <div className="tab-content">
          <div className="carousel-container">
            {canScrollLeft && (
              <div
                className="scroll-button left"
                onClick={() => scroll("left")}
              >
                ❮
              </div>
            )}
            <div className="tile-grid single-view" ref={scrollContainerRef}>
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

                      // 2. Get all other tiles for the tab, filtering out autotile members unless showAllVariants is true
                      const allOtherTiles = group.tileIds
                        .map((tileId) => ({
                          tile: config.tiles[tileId],
                          isAutotileRep: false,
                        }))
                        .filter(({ tile }) => {
                          if (!tile.autotile) return true;
                          return showAllVariants;
                        });

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
                </div>
              ))}
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
        </div>
      </div>
    </div>
  );
};
