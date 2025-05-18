import { Button } from "@/components/ui/button";

export type SaveStatus = "idle" | "success" | "error" | "json-error";

interface SettingsTabHeaderFooterProps {
  headerText: string;
  onSave?: (e: React.FormEvent) => void;
  saveStatus?: SaveStatus;
  isDisabled?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
  /**
   * Whether to wrap children in a form element. If false, you must
   * include your own form element within children or have elements that work with a generic button onClick.
   */
  wrapInForm?: boolean;
  /**
   * Maximum height for the scrollable content area
   */
  maxContentHeight?: string;
  /**
   * When true, no footer with save button will be rendered
   */
  noFooter?: boolean;
}

export const SettingsTabHeaderFooter = ({
  headerText,
  onSave,
  saveStatus,
  isDisabled = false,
  isLoading = false,
  children,
  wrapInForm = false,
  maxContentHeight = "calc(100vh - 160px)",
  noFooter = false,
}: SettingsTabHeaderFooterProps) => {
  // Create the save button component
  const saveButton = (
    <>
      <Button
        type="submit"
        disabled={isDisabled || isLoading}
        onClick={wrapInForm ? undefined : onSave}
      >
        {isLoading ? "Saving..." : "Save"}
      </Button>
      {saveStatus === "success" && (
        <span className="ml-2 text-green-400 flex items-center">
          Settings saved!
        </span>
      )}
      {saveStatus === "error" && (
        <span className="ml-2 text-red-400 flex items-center">
          Failed to save settings
        </span>
      )}
      {saveStatus === "json-error" && (
        <span className="ml-2 text-red-400 flex items-center">
          Invalid JSON in options
        </span>
      )}
    </>
  );

  // Different content based on whether we're wrapping in a form and whether we show footer
  const content = wrapInForm ? (
    <form className="flex flex-col h-full" onSubmit={onSave}>
      <div
        className={`flex-1 overflow-auto px-4 py-2 ${noFooter ? "pb-4" : ""}`}
        style={{
          maxHeight: noFooter ? "calc(100vh - 80px)" : maxContentHeight,
        }}
      >
        {children}
      </div>
      {!noFooter && (
        <div className="sticky bottom-0 bg-background border-t p-4 flex items-center z-10">
          {saveButton}
        </div>
      )}
    </form>
  ) : (
    <>
      <div
        className={`flex-1 overflow-auto px-4 py-2 ${noFooter ? "pb-4" : ""}`}
        style={{
          maxHeight: noFooter ? "calc(100vh - 80px)" : maxContentHeight,
        }}
      >
        {children}
      </div>
      {!noFooter && (
        <div className="sticky bottom-0 bg-background border-t p-4 flex items-center z-10">
          {saveButton}
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-background border-b p-4 z-10">
        <h2 className="text-lg font-medium">{headerText}</h2>
      </div>
      {content}
    </div>
  );
};
