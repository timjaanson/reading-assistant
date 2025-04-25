import { Square } from "lucide-react";

export const StopIndicator = () => {
  return (
    <div className="inline-flex items-center justify-center relative w-4 h-4">
      <Square
        size={4}
        className="opacity-80 animate-[pulse_2s_infinite] text-background bg-background dark:text-foreground dark:bg-foreground"
      />
      <Square
        size={4}
        className="absolute inset-0 opacity-50 animate-[ping_2s_infinite] text-background bg-background dark:text-foreground dark:bg-foreground"
      />
    </div>
  );
};
