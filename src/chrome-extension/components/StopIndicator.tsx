type StopIndicatorProps = {
  size?: number;
};

export const StopIndicator = ({ size = 8 }: StopIndicatorProps) => {
  return (
    <div className="inline-flex items-center justify-center relative">
      {/* Core stop square */}
      <div
        className="animate-pulse"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: "currentColor",
        }}
      />

      {/* Subtle pulsing halo effect */}
      <div
        className="absolute inset-0 opacity-60 animate-ping"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: "currentColor",
          animationDuration: "1.5s",
        }}
      />
    </div>
  );
};
