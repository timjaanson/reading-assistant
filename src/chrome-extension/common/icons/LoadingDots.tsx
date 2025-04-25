import { FC } from "react";

type LoadingDotsProps = {
  size?: number; // Size in Tailwind units (1 unit = 0.25rem = 4px)
};

export const LoadingDots: FC<LoadingDotsProps> = ({ size = 4 }) => {
  const dotStyle = {
    width: `${(size * 0.25) / 2}rem`,
    height: `${size * 0.25}rem`,
  };
  const dotClasses = `bg-accent rounded-full animate-bounce`;

  return (
    <div className="flex items-center justify-center space-x-1">
      <span
        style={dotStyle}
        className={`${dotClasses} [animation-delay:0s]`}
      ></span>
      <span
        style={dotStyle}
        className={`${dotClasses} [animation-delay:0.2s]`}
      ></span>
      <span
        style={dotStyle}
        className={`${dotClasses} [animation-delay:0.4s]`}
      ></span>
    </div>
  );
};
