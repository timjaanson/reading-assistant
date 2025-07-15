import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  onClick: () => void;
}

export const CopyButton = ({ onClick }: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleClick = () => {
    onClick();
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <button
      className="bg-card hover:bg-muted text-foreground p-1 rounded-sm text-xs w-7 h-7 flex items-center justify-center cursor-pointer border border-border transition-colors"
      onClick={handleClick}
      title="Copy to clipboard"
    >
      {isCopied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
};
