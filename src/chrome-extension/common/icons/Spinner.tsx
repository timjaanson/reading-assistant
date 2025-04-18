import { FC } from "react";

export type SpinnerProps = {
  size?: number;
  color?: string;
};

export const Spinner: FC<SpinnerProps> = ({ size = 4, color = "gray-900" }) => {
  return (
    <span
      className={`inline-block rounded-full border-[3px] border-${color} border-b-transparent animate-spin w-${size} h-${size} box-border`}
    ></span>
  );
};
