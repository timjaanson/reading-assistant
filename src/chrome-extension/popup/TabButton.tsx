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
      className={`px-4 py-2 font-medium text-sm ${
        isActive
          ? "border-b-2 border-blue-500 text-blue-600"
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
};
