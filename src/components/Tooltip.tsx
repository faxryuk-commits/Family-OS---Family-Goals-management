"use client";

import { useState, ReactNode } from "react";

type TooltipProps = {
  children: ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
};

export function Tooltip({ children, content, position = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute ${positionClasses[position]} z-50 px-3 py-2 text-sm bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl max-w-xs whitespace-normal animate-fade-in`}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-[var(--card)] border-[var(--border)] transform rotate-45 ${
              position === "top"
                ? "top-full left-1/2 -translate-x-1/2 -mt-1 border-t-0 border-l-0"
                : position === "bottom"
                ? "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-0 border-r-0"
                : position === "left"
                ? "left-full top-1/2 -translate-y-1/2 -ml-1 border-l-0 border-b-0"
                : "right-full top-1/2 -translate-y-1/2 -mr-1 border-r-0 border-t-0"
            }`}
          />
        </div>
      )}
    </div>
  );
}

type HelpIconProps = {
  text: string;
  size?: "sm" | "md";
};

export function HelpIcon({ text, size = "sm" }: HelpIconProps) {
  const sizeClasses = size === "sm" ? "w-4 h-4 text-xs" : "w-5 h-5 text-sm";

  return (
    <Tooltip content={text}>
      <span
        className={`${sizeClasses} inline-flex items-center justify-center rounded-full bg-[var(--muted)]/20 text-[var(--muted)] cursor-help hover:bg-[var(--muted)]/30 transition-colors`}
      >
        ?
      </span>
    </Tooltip>
  );
}
