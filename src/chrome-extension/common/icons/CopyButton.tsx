import { useState } from "react";

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
      className="bg-transparent hover:bg-gray-600 text-white p-1 rounded text-xs w-7 h-7 flex items-center justify-center cursor-pointer"
      onClick={handleClick}
      title="Copy to clipboard"
    >
      {isCopied ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 12.6111L8.92308 17.5L20 6.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 352.804 352.804" fill="white">
          <path d="M318.54,57.282h-47.652V15c0-8.284-6.716-15-15-15H34.264c-8.284,0-15,6.716-15,15v265.522c0,8.284,6.716,15,15,15h47.651 v42.281c0,8.284,6.716,15,15,15H318.54c8.284,0,15-6.716,15-15V72.282C333.54,63.998,326.824,57.282,318.54,57.282z M49.264,265.522V30h191.623v27.282H96.916c-8.284,0-15,6.716-15,15v193.24H49.264z M303.54,322.804H111.916V87.282H303.54V322.804z" />
        </svg>
      )}
    </button>
  );
};
