import { Mic, MicOff, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { RealtimeConnectionState } from "./realtimeConnection";
import { MicrophoneLevelIndicator } from "./MicrophoneLevelIndicator";
import { ConnectionStatus } from "./ConnectionStatus";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Spinner } from "../common/icons/Spinner";

interface RealtimeControlsProps {
  state: RealtimeConnectionState;
  onStartSession: () => void;
  onToggleMute: () => void;
  onEndSession: () => void;
}

export const RealtimeControls = ({
  state,
  onStartSession,
  onToggleMute,
  onEndSession,
}: RealtimeControlsProps) => {
  const { isSessionActive, isMuted, isConnected, error } = state;

  const connecting = isSessionActive && !isConnected;

  const getStatusMessage = () => {
    if (error) {
      return "Error connecting to voice chat";
    }
    if (isConnected) {
      return "Connected";
    }
    if (connecting) {
      return "Connecting...";
    }
    return "Disconnected";
  };

  return (
    <div className="w-full max-w-md">
      {error && (
        <div className="text-destructive bg-destructive/10 p-2 rounded mb-2 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center mr-2">
              <ConnectionStatus state={state} hideText />
            </div>
          </TooltipTrigger>
          <TooltipContent>{getStatusMessage()}</TooltipContent>
        </Tooltip>

        {!isSessionActive && !connecting ? (
          <Button
            onClick={onStartSession}
            size="sm"
            className="flex flex-col h-12 w-12 rounded-full"
          >
            <Play />
          </Button>
        ) : connecting ? (
          <div className="flex items-center justify-center h-12 w-12">
            <Spinner size={8} />
          </div>
        ) : (
          <>
            <Toggle
              pressed={isMuted}
              onPressedChange={onToggleMute}
              disabled={!isConnected}
              className={`flex flex-col h-12 w-12 rounded-full ${
                isMuted ? "bg-destructive text-destructive-foreground" : ""
              } ${!isConnected && "opacity-50"}`}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </Toggle>

            {isConnected && (
              <div className="mx-1 flex items-center justify-center">
                <MicrophoneLevelIndicator state={state} />
              </div>
            )}

            <Button
              variant="destructive"
              onClick={onEndSession}
              size="sm"
              className="flex flex-col h-12 w-12 rounded-full"
            >
              <X />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
