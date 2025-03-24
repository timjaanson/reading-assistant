import React from "react";

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const TabButton = ({ isActive, onClick, children }: TabButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 font-medium text-sm ${
        isActive
          ? "border-b-2 border-gray-200 text-gray-200"
          : "text-gray-400 hover:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
};
