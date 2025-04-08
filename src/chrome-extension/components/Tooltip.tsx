import { useState } from "react";
import type { ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  target?: ReactNode; // Make target optional
  className?: string; // Allow additional styling for the tooltip content
  position?: "top" | "bottom"; // Add position prop
  disabled?: boolean;
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

export const Tooltip = ({
  children,
  target,
  className = "",
  position = "bottom", // Default to bottom
  disabled = false,
}: TooltipProps) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(disabled);

  const Trigger = target ? <>{target}</> : <DefaultTarget />;

  // Calculate position classes based on the prop
  const positionClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
  }[position];

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => !disabled && setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
      >
        {Trigger}
      </div>
      <div
        className={`absolute w-max max-w-96 left-1/2 -translate-x-1/2 ${positionClasses} p-2 bg-black/75 text-xs text-gray-200 rounded shadow-lg transition-opacity duration-200 z-10 ${
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
