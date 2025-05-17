import { useChat } from "@ai-sdk/react";
import { createCustomBackgroundFetch } from "../ai/custom-fetch";
import { useEffect, useRef, useState } from "react";
import { StopIndicator } from "../common/icons/StopIndicator";
import { LoadingDots } from "../common/icons/LoadingDots";
import { SendIcon } from "../common/icons/Send";
import { Button } from "@/components/ui/button";
import { ProviderQuickSelect } from "./ProviderQuickSelect";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, FileText, Plus, Mic } from "lucide-react";
import { File as FileIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveTabContent } from "../util/pageContent";
import { Message, UIMessage } from "ai";
import {
  fillMessageParts,
  prepareAttachmentsForRequest,
  ToolInvocation,
} from "@ai-sdk/ui-utils";
import { Realtime } from "./Realtime";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { messagesHasUnresolvedToolCalls } from "../ai/utils";
import { ToolName } from "../ai/toolType";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [providerSelectClosed, setProviderSelectClosed] = useState(true);
  const currentUserMessage = useRef<UIMessage[] | null>(null);
  const lastAssistantMessage = useRef<Message | null>(null);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);

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
    onFinish(message) {
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
    setShowAddMenu(false);
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 50);
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
    setShowAddMenu(false);

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

  const toggleAddMenu = () => {
    setShowAddMenu(!showAddMenu);
    if (!showAddMenu) {
      setProviderSelectClosed(true);
    }
  };

  useEffect(() => {
    const handleBodyClick = () => {
      if (showAddMenu) {
        setShowAddMenu(false);
      }
    };
    document.body.addEventListener("click", handleBodyClick);

    return () => {
      document.body.removeEventListener("click", handleBodyClick);
    };
  }, [showAddMenu]);

  const plusButtonClicked = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleAddMenu();
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
      <div className="shrink-0 bg-transparent p-1 border-t">
        <form onSubmit={submitMessageHandler}>
          <div className="flex items-center space-x-1">
            <div className="relative w-full flex text-sm max-h-32">
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
                    submitMessageHandler(e as any);
                  }
                }}
                onKeyUp={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                placeholder={isBusy ? "" : "Type your message"}
                className="min-h-16 flex-1 border rounded-md py-2 px-3 resize-none scrollbar-none text-sm w-full pr-7"
              />
              {isBusy && (
                <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none">
                  <LoadingDots size={3} />
                </div>
              )}
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <div className="flex flex-col items-center space-y-1">
                  <button
                    type="button"
                    onClick={plusButtonClicked}
                    disabled={isBusy}
                    title="Add content"
                    className="text-md cursor-pointer transition-colors"
                  >
                    <Plus className="text-foreground p-1" />
                  </button>
                  <Tooltip>
                    <TooltipTrigger>
                      <Toggle
                        pressed={isVoiceChatActive}
                        onPressedChange={setIsVoiceChatActive}
                        disabled={isBusy}
                        size="sm"
                      >
                        <Mic className="h-4 w-4" />
                      </Toggle>
                    </TooltipTrigger>
                    <TooltipContent avoidCollisions>
                      <p>Activate realtime voicechat proxy</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

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

            <ProviderQuickSelect
              disabled={isBusy}
              closed={providerSelectClosed}
              onToggle={(isOpen) => setProviderSelectClosed(!isOpen)}
            />

            <Button
              type={isBusy ? "button" : "submit"}
              onClick={isBusy ? () => stop() : undefined}
            >
              <span className="px-2 py-1 flex items-center justify-center">
                {isBusy ? <StopIndicator /> : <SendIcon />}
              </span>
            </Button>
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

      {/* Dropdown menu positioned at fixed location in DOM */}
      {showAddMenu && (
        <div
          className="absolute bottom-14 right-[50px] z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="w-44 py-1">
            <CardContent className="p-0">
              <div className="flex flex-col text-sm">
                <button
                  type="button"
                  onClick={handleFileButtonClick}
                  className="cursor-pointer flex items-center gap-2 px-3 py-2 hover:bg-muted text-left"
                >
                  <Paperclip size={14} />
                  <span>Attach file</span>
                </button>
                <button
                  type="button"
                  onClick={handleExtractPageContent}
                  className="cursor-pointer flex items-center gap-2 px-3 py-2 hover:bg-muted text-left"
                >
                  <FileText size={14} />
                  <span>Extract page text</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
