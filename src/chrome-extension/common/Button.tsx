export const Button = ({
  children,
  type = "button",
  textSize = "md",
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  textSize?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer px-4 py-2 bg-gray-200/80 text-gray-900 rounded-md hover:bg-gray-300/80 disabled:bg-gray-500/40 disabled:text-gray-400 ${
        textSize === "sm" && "text-sm"
      }`}
    >
      {children}
    </button>
  );
};
