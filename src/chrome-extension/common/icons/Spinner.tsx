import { FC } from "react";

export type SpinnerProps = {
  size?: number;
};

export const Spinner: FC<SpinnerProps> = ({ size = 4 }) => {
  return (
    <span
      className={`inline-block rounded-full border-[3px] border-primary border-b-transparent animate-spin w-${size} h-${size} box-border`}
    ></span>
  );
};
