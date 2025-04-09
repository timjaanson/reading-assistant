import { useState, useRef, useEffect, type ReactNode } from "react";

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
  const [isTooltipVisible, setIsTooltipVisible] = useState(false); // Tooltip starts hidden
  const [tooltipStyle, setTooltipStyle] = useState({});
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const Trigger = target ? <>{target}</> : <DefaultTarget />;

  // Calculate position classes based on the prop
  const positionClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
  }[position];

  // Effect to handle initial disabled state (though onMouseEnter already checks)
  // and to recalculate position if visibility or dimensions change.
  useEffect(() => {
    if (disabled) {
      setIsTooltipVisible(false); // Ensure hidden if disabled
      return; // No need to calculate position if disabled
    }

    if (
      isTooltipVisible &&
      containerRef.current &&
      triggerRef.current &&
      tooltipRef.current
    ) {
      const containerRect = containerRef.current.getBoundingClientRect();
      // Ensure trigger has a DOM node (it might be a fragment if target is passed directly)
      // Find the first actual element node within the triggerRef div
      const triggerElement =
        triggerRef.current.firstElementChild || triggerRef.current;
      const triggerRect = triggerElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      // Check if tooltip has valid dimensions before calculating
      if (tooltipRect.width === 0 || tooltipRect.height === 0) return;

      const viewportWidth = window.innerWidth;
      const margin = 8; // Viewport margin in pixels

      // Calculate the ideal horizontal center relative to the trigger, in viewport coordinates
      const idealViewportLeft =
        triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

      // Clamp the left position to stay within viewport bounds
      const adjustedViewportLeft = Math.max(
        margin,
        Math.min(idealViewportLeft, viewportWidth - tooltipRect.width - margin)
      );

      // Convert the adjusted viewport-relative left position to be relative to the container
      const styleLeft = adjustedViewportLeft - containerRect.left;

      // Update the style state
      setTooltipStyle({
        left: `${styleLeft}px`,
        transform: "translateX(0)", // Override Tailwind translate if it was previously applied
      });
    }
    // When tooltip becomes hidden, we don't strictly need to reset the style,
    // as opacity controls visibility. Keeping the style might prevent minor reflow on reappear.
  }, [isTooltipVisible, children, className, position, disabled]); // Re-calculate if these change

  return (
    <div ref={containerRef} className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={() => !disabled && setIsTooltipVisible(true)}
        onMouseLeave={() => !disabled && setIsTooltipVisible(false)}
      >
        {Trigger}
      </div>
      <div
        ref={tooltipRef}
        className={`absolute w-max max-w-96 ${positionClasses} p-2 bg-black/75 text-xs text-gray-200 rounded shadow-lg transition-opacity duration-200 z-10 ${
          isTooltipVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        } ${className}`}
        style={tooltipStyle}
        role="tooltip"
        aria-hidden={!isTooltipVisible}
      >
        {children}
      </div>
    </div>
  );
};

export default Tooltip;
