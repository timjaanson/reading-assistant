import { Info } from "lucide-react";
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
  <button className="flex items-center m-1" aria-label="Help">
    <Info size={14} className="text-foreground" />
  </button>
);

export const Tooltip = ({
  children,
  target,
  className = "",
  position = "bottom",
  disabled = false,
}: TooltipProps) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const Trigger = target ? <>{target}</> : <DefaultTarget />;

  const positionClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
  }[position];

  useEffect(() => {
    if (disabled) {
      setIsTooltipVisible(false);
      return;
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

      if (tooltipRect.width === 0 || tooltipRect.height === 0) return;

      const viewportWidth = window.innerWidth;
      const margin = 8;

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
        className={`absolute w-max max-w-96 ${positionClasses} p-2 bg-card text-xs rounded-lg shadow-lg transition-opacity duration-200 z-10 ${
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
