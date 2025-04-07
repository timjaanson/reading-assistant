import { useState } from "react";
import type { ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  target?: ReactNode; // Make target optional
  className?: string; // Allow additional styling for the tooltip content
}

// Default target component (question mark icon button)
const DefaultTarget = () => (
  <button
    className="text-gray-400 hover:text-gray-200 flex items-center"
    aria-label="Help"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  </button>
);

export const Tooltip = ({ children, target, className = "" }: TooltipProps) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const Trigger = target ? <>{target}</> : <DefaultTarget />;

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
      >
        {Trigger}
      </div>
      <div
        className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-2 bg-black text-xs text-gray-200 rounded shadow-lg transition-opacity duration-200 z-10 ${
          isTooltipVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        } ${className}`}
        role="tooltip"
      >
        {children}
      </div>
    </div>
  );
};

export default Tooltip;
