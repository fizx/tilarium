import React, { useState, useRef, useEffect, ReactNode } from "react";

interface ScrollableContainerProps {
  children: ReactNode;
  className?: string;
}

export const ScrollableContainer = ({
  children,
  className,
}: ScrollableContainerProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      // A small tolerance is added to prevent floating point inaccuracies
      const scrollableWidth = scrollWidth - clientWidth;
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft < scrollableWidth - 1);
    };

    checkScroll(); // Initial check

    // Set up observers
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);
    el.addEventListener("scroll", checkScroll, { passive: true });

    // A timeout can help catch cases where initial render dimensions are not final
    const timeoutId = setTimeout(checkScroll, 150);

    return () => {
      resizeObserver.disconnect();
      el.removeEventListener("scroll", checkScroll);
      clearTimeout(timeoutId);
    };
  }, [children]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={`carousel-container ${className || ""}`}>
      {canScrollLeft && (
        <div className="scroll-button left" onClick={() => scroll("left")}>
          ❮
        </div>
      )}
      <div className="scroll-content" ref={scrollContainerRef}>
        {children}
      </div>
      {canScrollRight && (
        <div className="scroll-button right" onClick={() => scroll("right")}>
          ❯
        </div>
      )}
    </div>
  );
};
