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
import {
  LanguageModelUsage,
  UIMessage,
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { Realtime } from "./Realtime";
import { Toggle } from "@/components/ui/toggle";
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
import { MessageRenderer } from "./MessageRenderer";

type ChatInputProps = {
  chatId: string;
  initialMessages: UIMessage[];
  systemPrompt?: string;
  initialChatName: string;
  pageUrl?: URL;
};

export const ChatInput = ({ chatId, initialMessages }: ChatInputProps) => {
  const [visualError, setVisualError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserMessage = useRef<UIMessage[] | null>(null);
  const lastAssistantMessage = useRef<UIMessage | null>(null);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [modelUsage] = useState<LanguageModelUsage | null>(null);
  const [input, setInput] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentToolCall, setCurrentToolCall] = useState<
    (Record<string, unknown> & { toolName: string; toolCallId: string }) | null
  >(null);

  const {
    messages,
    addToolResult,
    sendMessage,
    setMessages,
    stop,
    status,
    error,
  } = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      // route through extension background
      fetch: createCustomBackgroundFetch(),
    }),
    experimental_throttle: 50,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

    async onToolCall({ toolCall }) {
      if (toolCall.toolName === ToolName.EXTRACT_ACTIVE_TAB_CONTENT) {
        setCurrentToolCall(
          toolCall as unknown as {
            toolName: string;
            toolCallId: string;
          }
        );
      }
      // Other tools are handled server-side
    },
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (error) {
      console.error("Error in useChat hook", error);
      setVisualError(error.message);
    }
  }, [error]);

  // Track last assistant message when messages change
  useEffect(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (lastAssistant) {
      lastAssistantMessage.current = lastAssistant;
    }
  }, [messages, status]);

  useEffect(() => {
    if (currentToolCall) {
      setDialogOpen(true);
    }
  }, [currentToolCall]);

  const handleExtractRequest = (approved: boolean) => {
    if (!currentToolCall) return;

    if (!approved) {
      addToolResult({
        tool: currentToolCall.toolName,
        toolCallId: currentToolCall.toolCallId,
        output: { error: "User denied access to the active tab" },
      });
      setDialogOpen(false);
      setCurrentToolCall(null);
      return;
    }

    getActiveTabContent()
      .then((r) => {
        addToolResult({
          tool: currentToolCall.toolName,
          toolCallId: currentToolCall.toolCallId,
          output: r,
        });
      })
      .catch((e) => {
        console.error("Error getting active tab content", e);
        addToolResult({
          tool: currentToolCall.toolName,
          toolCallId: currentToolCall.toolCallId,
          output: { error: JSON.stringify(e) },
        });
      })
      .finally(() => {
        setDialogOpen(false);
        setCurrentToolCall(null);
      });
  };

  const submitMessageHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setVisualError(null);

    currentUserMessage.current = null;

    if (!input.trim() && (!files || files.length === 0)) return;

    setInput("");
    setFiles(undefined);

    await sendMessage({ text: input, files: files });

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

      const newMessage: UIMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        parts: [
          {
            type: "text",
            text: `[URL](${result.url}) ${
              result.error ? " " + result.error : ""
            }\n${result.text}`,
          },
        ],
      };

      setMessages((msgs) => [...msgs, newMessage]);
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
    <div className="flex flex-col h-full min-h-0 w-full mx-auto relative text-sm">
      {/* Messages list (scrollable) */}
      <div className="max-w-full flex-1 overflow-y-auto p-2 space-y-2 bg-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <MessageRenderer message={message} />
          </div>
        ))}
      </div>

      {/* Bottom input section (static) */}
      <div className="shrink-0">
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
              {/* Textarea Row */}
              <div className="w-full">
                <div className="relative flex text-sm max-h-44">
                  <Textarea
                    disabled={isBusy}
                    autoFocus
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
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
              </div>

              {/* Action Buttons Row with Left and Right Groups */}
              <div className="flex items-center space-x-2 w-full">
                {/* Left Scrollable Group */}
                <div className="flex-1 min-w-0">
                  <ScrollArea className="w-full">
                    <div className="flex items-center space-x-3 p-1 min-w-max">
                      <ProviderQuickSelect disabled={isBusy} />

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
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>

                {/* Right Always-Visible Group */}
                <div className="flex items-center flex-shrink-0 space-x-2">
                  {modelUsage && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={16} />
                      </TooltipTrigger>
                      <TooltipContent avoidCollisions>
                        <Label>Last Message Tokens</Label>
                        <p>input: {modelUsage.inputTokens}</p>
                        <p>output: {modelUsage.outputTokens}</p>
                        <p>total: {modelUsage.totalTokens}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  <Button
                    type={isBusy ? "button" : "submit"}
                    size="icon"
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
              </div>
            </div>
          </form>
        </div>

        {/* Error */}
        <div>
          {visualError && (
            <div className="text-destructive overflow-y-auto break-all">
              {visualError}
            </div>
          )}
        </div>

        {/* Realtime */}
        {isVoiceChatActive && (
          <Realtime
            lastMessage={lastAssistantMessage}
            sendMessage={sendMessage}
          />
        )}

        {/* Tool approval dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogTitle>User action required</DialogTitle>
            <DialogDescription>
              The assistant is requesting to extract content from your active
              tab. Would you like to approve this request?
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
    </div>
  );
};
