import {
  ChangeEvent,
  KeyboardEvent,
  ForwardRefRenderFunction,
  forwardRef,
  InputHTMLAttributes,
} from "react";

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

const InputComponent: ForwardRefRenderFunction<HTMLInputElement, InputProps> = (
  {
    value,
    onChange,
    onKeyDown,
    onBlur,
    placeholder = "",
    className = "",
    compact = false,
    ...restProps
  },
  ref
) => {
  // Use same classes as the textarea in Chat.tsx component
  const baseClasses =
    "text-gray-200 border border-gray-800 rounded-md resize-none bg-[#1f1f1f]/50";
  const sizeClasses = compact ? "p-1 text-sm" : "p-2";
  const combinedClasses = `${baseClasses} ${sizeClasses} ${className}`;

  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      placeholder={placeholder}
      ref={ref}
      className={combinedClasses}
      {...restProps}
    />
  );
};

export const Input = forwardRef(InputComponent);
export default Input;
