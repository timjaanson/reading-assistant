import { CopyButton } from "../common/icons/CopyButton";

export const CodeBlock = ({ children }: { children: React.ReactNode }) => {
  const showCopyButton =
    typeof children === "string" &&
    (children.length > 60 || (children.match(/\n/g)?.length ?? 0) >= 2);

  const handleCopy = () => {
    if (typeof children === "string") {
      navigator.clipboard.writeText(children);
    }
  };

  return (
    <div className="relative inline-block max-w-full align-middle">
      {showCopyButton && (
        <div className="absolute top-1 right-1 z-10">
          <CopyButton onClick={handleCopy} />
        </div>
      )}
      <pre className="max-w-full">
        <code
          className={`relative font-mono bg-gray-800/75 text-gray-100 p-1 ${
            showCopyButton ? "pr-10" : ""
          } rounded-sm inline-block max-w-full overflow-x-auto`}
        >
          {children}
        </code>
      </pre>
    </div>
  );
};
