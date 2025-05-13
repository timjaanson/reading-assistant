import { useEffect, useRef, useState } from "react";
import {
  RealtimeConnection,
  RealtimeConnectionState,
} from "../realtime/realtimeConnection";
import { RealtimeControls } from "../realtime/RealtimeControls";
import { SettingsStorage } from "../storage/providerSettings";
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { createCustomBackgroundFetch } from "../ai/custom-fetch";
import { REALTIME_AGENT_SYSTEM_PROMPT } from "../ai/prompts";

type RealtimeProps = {
  chatId: string;
};

export const Realtime = ({ chatId }: RealtimeProps) => {
  const realtimeConnection = useRef<RealtimeConnection | null>(null);
  const [connectionState, setConnectionState] =
    useState<RealtimeConnectionState>({
      isConnected: false,
      isMuted: false,
      isSessionActive: false,
    });
  const [micPermissionGranted, setMicPermissionGranted] =
    useState<boolean>(false);
  const [realtimeAvailable, setRealtimeAvailable] = useState<boolean>(false);

  const agentChat = useChat({
    id: chatId,
    fetch: createCustomBackgroundFetch(),
    body: {
      systemPrompt: REALTIME_AGENT_SYSTEM_PROMPT,
      useSync: true,
    },
    onFinish: (message) => {
      if (realtimeConnection.current && message.parts) {
        realtimeConnection.current.lastResponse = message.parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("\n");
      } else {
        console.error(
          "No realtime connection or message parts",
          realtimeConnection.current,
          message
        );
      }
    },
  });

  useEffect(() => {
    const checkRealtimeAvailability = async () => {
      const providerSettings =
        await SettingsStorage.loadProviderSettingsByProviderId("openai");
      if (providerSettings && providerSettings.apiKey) {
        setRealtimeAvailable(true);
      }
    };

    checkRealtimeAvailability();

    const connection = new RealtimeConnection(setConnectionState, agentChat);
    realtimeConnection.current = connection;

    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((result) => {
        if (result.state === "granted") {
          setMicPermissionGranted(true);
        }
      })
      .catch((err) =>
        console.error("Error checking microphone permission:", err)
      );

    return () => {
      if (connection) {
        connection.endSession();
      }
    };
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          // Immediately stop tracks after permission is granted
          stream.getTracks().forEach((track) => track.stop());
          setMicPermissionGranted(true);
        });
    } catch (error) {
      console.error("Error requesting microphone permission:", error);
      setConnectionState({
        ...connectionState,
        error: "Microphone permission denied",
      });
    }
  };

  const handleStartSession = async () => {
    if (realtimeConnection.current) {
      await realtimeConnection.current.startSession();
    }
  };

  const handleToggleMute = () => {
    if (realtimeConnection.current) {
      realtimeConnection.current.toggleMute();
    }
  };

  const handleEndSession = () => {
    if (realtimeConnection.current) {
      realtimeConnection.current.endSession();
    }
  };

  return (
    <div className="flex flex-col items-center p-2">
      {!realtimeAvailable && (
        <div className="text-destructive mb-1 p-3 rounded-lg w-full max-w-md text-center">
          Realtime voice chat not available - OpenAI API key not set
        </div>
      )}

      {!micPermissionGranted ? (
        <Button onClick={requestMicrophonePermission}>
          Allow Microphone Access
        </Button>
      ) : (
        <RealtimeControls
          state={connectionState}
          onStartSession={handleStartSession}
          onToggleMute={handleToggleMute}
          onEndSession={handleEndSession}
        />
      )}
    </div>
  );
};
