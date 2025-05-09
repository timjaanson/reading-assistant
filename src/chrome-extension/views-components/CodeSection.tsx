import SyntaxHighlighter from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useMemo } from "react";
import { useTheme } from "../theme/theme-provider";

export const CodeSection = ({
  language,
  children,
}: {
  language: string;
  children: React.ReactNode;
}) => {
  const { theme } = useMemo(useTheme, []);

  return (
    <div className="max-w-full relative">
      <div className="overflow-x-auto max-w-full">
        <SyntaxHighlighter
          language={"python"}
          style={theme === "dark" ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            borderRadius: "0.375rem",
            fontSize: "0.9em",
          }}
          codeTagProps={{
            style: {
              whiteSpace: "pre",
              wordBreak: "normal",
              overflowWrap: "normal",
            },
          }}
          wrapLongLines={true}
          showLineNumbers={language !== "text" && language !== ""}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
