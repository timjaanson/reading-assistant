import { CopyButton } from "../common/icons/CopyButton";

type CodeBoxProps = {
  code: string;
};

export const CodeBox = ({ code }: CodeBoxProps) => {
  const lines = code.split("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="max-w-full overflow-x-auto border border-border dark:border-border rounded-md">
      <div className="flex bg-background font-mono text-sm">
        {/* Line numbers */}
        <div className="flex-shrink-0 px-3 py-2 bg-card text-muted-foreground select-none border-r border-border">
          <pre className="text-right">
            {lines.map((_, index) => (
              <div key={index} className="leading-5">
                {index + 1}
              </div>
            ))}
          </pre>
        </div>

        {/* Code content */}
        <div className="flex-1 px-3 py-2 text-foreground overflow-x-auto">
          <pre className="whitespace-pre leading-5">
            {lines.map((line, index) => (
              <div key={index} className="min-h-[1.25rem]">
                {line || " "}
              </div>
            ))}
          </pre>
        </div>

        {/* Copy button */}
        <div className="flex-shrink-0 px-2 py-2 bg-card border-l border-border flex items-start justify-center">
          <CopyButton onClick={handleCopy} />
        </div>
      </div>
    </div>
  );
};
