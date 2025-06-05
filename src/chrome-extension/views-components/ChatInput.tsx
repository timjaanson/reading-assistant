import { useChat } from "@ai-sdk/react";
import { createCustomBackgroundFetch } from "../ai/custom-fetch";
import { useEffect, useRef, useState } from "react";
import { LoadingDots } from "../common/icons/LoadingDots";
import { Button } from "@/components/ui/button";
import { ProviderQuickSelect } from "./ProviderQuickSelect";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Paperclip,
  FileText,
  Plus,
  Mic,
  SendHorizontal,
  Square,
  Info,
} from "lucide-react";
import { File as FileIcon } from "lucide-react";
import { getActiveTabContent } from "../util/pageContent";
import { LanguageModelUsage, Message, UIMessage } from "ai";
import {
  fillMessageParts,
  prepareAttachmentsForRequest,
  ToolInvocation,
} from "@ai-sdk/ui-utils";
import { Realtime } from "./Realtime";
import { Toggle } from "@/components/ui/toggle";
import { messagesHasUnresolvedToolCalls } from "../ai/utils";
import { ToolName } from "../ai/toolType";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";

type ChatInputProps = {
  chatId: string;
  initialMessages: UIMessage[];
  systemPrompt?: string;
  initialChatName: string;
  pageUrl?: URL;
};

export const ChatInput = ({
  chatId,
  initialMessages,
  systemPrompt,
}: ChatInputProps) => {
  const [visualError, setVisualError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserMessage = useRef<UIMessage[] | null>(null);
  const lastAssistantMessage = useRef<Message | null>(null);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [modelUsage, setModelUsage] = useState<LanguageModelUsage | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentToolInvocation, setCurrentToolInvocation] =
    useState<ToolInvocation | null>(null);

  const {
    input,
    messages,
    addToolResult,
    handleSubmit,
    append,
    handleInputChange,
    setMessages,
    stop,
    status,
    error,
  } = useChat({
    id: chatId,
    initialMessages: initialMessages,
    fetch: createCustomBackgroundFetch(),
    body: {
      systemPrompt: systemPrompt,
    },
    onFinish(message, options) {
      setModelUsage(options.usage);
      //TODO: this doesn't cover user added tool responses like extract content
      if (!messagesHasUnresolvedToolCalls([message])) {
        lastAssistantMessage.current = message;
      }
    },
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (error) {
      console.error("Error in useChat hook", error);
      setVisualError(error.message);
    }
  }, [error]);

  useEffect(() => {
    const extractActiveTabCallWithoutResult = messages.find(
      (message) =>
        message.role === "assistant" &&
        message.parts.find(
          (p) =>
            p.type === "tool-invocation" &&
            p.toolInvocation.state === "call" &&
            p.toolInvocation.toolName === ToolName.EXTRACT_ACTIVE_TAB_CONTENT
        )
    );

    if (extractActiveTabCallWithoutResult) {
      console.log(
        "extractActiveTabCallWithoutResult",
        extractActiveTabCallWithoutResult
      );

      const toolInvocationPart = extractActiveTabCallWithoutResult.parts.find(
        (p) =>
          p.type === "tool-invocation" &&
          p.toolInvocation.state === "call" &&
          p.toolInvocation.toolName === ToolName.EXTRACT_ACTIVE_TAB_CONTENT
      );

      if (toolInvocationPart && toolInvocationPart.type === "tool-invocation") {
        setCurrentToolInvocation(toolInvocationPart.toolInvocation);
      }
    }
  }, [messages]);

  useEffect(() => {
    if (currentToolInvocation) {
      setDialogOpen(true);
    }
  }, [currentToolInvocation]);

  const handleExtractRequest = (approved: boolean) => {
    if (!currentToolInvocation) {
      return;
    }
    if (!approved) {
      addToolResult({
        toolCallId: currentToolInvocation.toolCallId,
        result: {
          error: "User denied access to the active tab",
        },
      });
      setDialogOpen(false);
      return;
    }

    getActiveTabContent()
      .then((r) => {
        addToolResult({
          toolCallId: currentToolInvocation.toolCallId,
          result: r,
        });
      })
      .catch((e) => {
        console.error("Error getting active tab content", e);
        addToolResult({
          toolCallId: currentToolInvocation.toolCallId,
          result: {
            error: JSON.stringify(e),
          },
        });
      })
      .finally(() => setDialogOpen(false));
  };

  const submitMessageHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setVisualError(null);
    const attachments = await prepareAttachmentsForRequest(files);
    const userMessage = fillMessageParts([
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: input,
        experimental_attachments: attachments,
      } satisfies Message,
    ]);

    currentUserMessage.current = userMessage;

    handleSubmit(e, {
      experimental_attachments: files,
    });

    setFiles(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (fileToRemove: File) => {
    if (!files) return;

    const dataTransfer = new DataTransfer();
    Array.from(files).forEach((file) => {
      if (file !== fileToRemove) {
        dataTransfer.items.add(file);
      }
    });

    setFiles(dataTransfer.files);
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  const handleExtractPageContent = async () => {
    try {
      const result = await getActiveTabContent();

      // Create a message with the page content
      const newMessage = {
        id: `user-${Date.now()}`,
        role: "user" as const,
        content: `[URL](${result.url}) ${
          result.error ? " " + result.error : ""
        }\n${result.text}`,
      };

      setMessages((messages) => [...messages, newMessage]);
    } catch (error) {
      console.error("Error extracting page content:", error);
      setVisualError(
        error instanceof Error
          ? error.message
          : "Failed to extract page content"
      );
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Selected Files Indicator */}
      {files && files.length > 0 && (
        <div className="flex flex-wrap gap-2 py-1 px-2">
          {Array.from(files).map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="inline-flex gap-1 items-center bg-card/80 rounded-md px-2 py-1 text-xs"
            >
              <FileIcon size={8} className="text-foreground" />
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveFile(file)}
                className="ml-2"
                aria-label="Remove file"
              >
                <span className="text-foreground cursor-pointer">×</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Container */}
      <div className="shrink-0 bg-transparent p-2 border-t">
        <form onSubmit={submitMessageHandler}>
          <div className="flex flex-col space-y-2">
            {/* Textarea with Send Button Row */}
            <div className="flex items-center space-x-2">
              <div className="relative w-full flex text-sm max-h-44">
                <Textarea
                  disabled={isBusy}
                  autoFocus
                  value={input}
                  onChange={(e) => {
                    handleInputChange(e);
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitMessageHandler(
                        e as unknown as React.FormEvent<HTMLFormElement>
                      );
                    }
                  }}
                  onKeyUp={(e) => e.stopPropagation()}
                  onKeyPress={(e) => e.stopPropagation()}
                  placeholder={isBusy ? "" : "Type your message"}
                  className="min-h-16 flex-1 border rounded-md p-2 resize-none scrollbar-none text-sm w-full"
                />
                {isBusy && (
                  <div className="absolute top-3 left-4 pointer-events-none">
                    <LoadingDots size={3} />
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setFiles(e.target.files);
                    }
                  }}
                />
              </div>

              <Button
                type={isBusy ? "button" : "submit"}
                size="iconLg"
                onClick={isBusy ? () => stop() : undefined}
              >
                <span className="px-2 py-1 flex items-center justify-center">
                  {isBusy ? (
                    <div
                      className={`inline-flex items-center justify-center relative`}
                    >
                      <Square
                        size={12}
                        className="opacity-80 animate-[pulse_2s_infinite] text-background bg-background dark:text-foreground dark:bg-foreground"
                      />
                      <Square
                        size={12}
                        className="absolute inset-0 opacity-50 animate-[ping_2s_infinite] text-background bg-background dark:text-foreground dark:bg-foreground"
                      />
                    </div>
                  ) : (
                    <SendHorizontal
                      size={12}
                      className="text-background fill-background dark:text-foreground dark:fill-foreground"
                    />
                  )}
                </span>
              </Button>
            </div>

            {/* Action Buttons Row with ScrollArea */}
            <div className="w-full">
              <ScrollArea className="w-full">
                <div className="flex items-center space-x-4 p-1 min-w-max">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isBusy}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent avoidCollisions>
                      <DropdownMenuItem onClick={handleFileButtonClick}>
                        <Paperclip className="h-4 w-4" />
                        <span>Attach file</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExtractPageContent}>
                        <FileText className="h-4 w-4" />
                        <span>Extract active tab text</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Toggle
                    pressed={isVoiceChatActive}
                    onPressedChange={setIsVoiceChatActive}
                    disabled={isBusy}
                    size="sm"
                  >
                    <Mic className="h-4 w-4" />
                    <span>Voice</span>
                  </Toggle>

                  <div className="flex items-center space-x-1">
                    <ProviderQuickSelect disabled={isBusy} />

                    {modelUsage && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info size={16} />
                        </TooltipTrigger>
                        <TooltipContent avoidCollisions>
                          <Label>Last Message Tokens</Label>
                          <p>
                            {modelUsage.promptTokens} input (+system prompt)
                          </p>
                          <p>{modelUsage.completionTokens} output</p>
                          <p>{modelUsage.totalTokens} total</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>
        </form>
      </div>
      <div>
        {visualError && (
          <div className="text-destructive overflow-y-auto break-all">
            {visualError}
          </div>
        )}
      </div>

      {isVoiceChatActive && (
        <Realtime lastMessage={lastAssistantMessage} append={append} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogTitle>User action required</DialogTitle>
          <DialogDescription>
            The assistant is requesting to extract content from your active tab.
            Would you like to approve this request?
          </DialogDescription>
          <DialogFooter>
            <Button
              className="mr-4 max-w-32"
              onClick={() => handleExtractRequest(true)}
            >
              Approve
            </Button>
            <Button
              className="max-w-32"
              variant="destructive"
              onClick={() => handleExtractRequest(false)}
            >
              Deny
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
