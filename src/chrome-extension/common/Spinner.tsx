import { FC } from "react";

export type SpinnerProps = {
  size?: number;
};

export const Spinner: FC<SpinnerProps> = ({ size = 4 }) => {
  return (
    <span
      className={`assisted-reading-loader border-[3px] border-gray-900 w-${size} h-${size}`}
    ></span>
  );
};
