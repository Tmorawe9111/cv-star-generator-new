import React from "react";

const hscrollStyle: React.CSSProperties = {
  WebkitOverflowScrolling: "touch",
  touchAction: "pan-x pinch-zoom",
  overscrollBehaviorX: "contain",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  scrollSnapType: "x mandatory",
};

export interface HorizontalScrollSectionProps {
  children: React.ReactNode;
}

export const HorizontalScrollSection: React.FC<HorizontalScrollSectionProps> = ({
  children,
}) => (
  <div
    data-hscroll="true"
    className="overflow-x-auto scroll-smooth snap-x snap-mandatory"
    style={hscrollStyle}
  >
    <div className="flex gap-3 px-4 pb-2" style={{ width: "max-content" }}>
      {children}
    </div>
  </div>
);
