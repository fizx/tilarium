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
    const checkScroll = () => {
      const el = scrollContainerRef.current;
      if (el) {
        const { scrollLeft, scrollWidth, clientWidth } = el;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
      }
    };

    const el = scrollContainerRef.current;
    if (el) {
      checkScroll();
      el.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
    }

    const timeoutId = setTimeout(checkScroll, 100);

    return () => {
      if (el) {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      }
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
