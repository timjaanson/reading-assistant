import { useEffect, useState } from "react";
import {
  RealtimeConnection,
  RealtimeConnectionState,
} from "../realtime/realtimeConnection";
import { RealtimeControls } from "../realtime/RealtimeControls";
import { ConnectionStatus } from "../realtime/ConnectionStatus";
import { MicrophoneLevelIndicator } from "../realtime/MicrophoneLevelIndicator";
import { SettingsStorage } from "../storage/providerSettings";
import { Button } from "@/components/ui/button";

export const Realtime = () => {
  const [realtimeConnection, setRealtimeConnection] =
    useState<RealtimeConnection | null>(null);
  const [connectionState, setConnectionState] =
    useState<RealtimeConnectionState>({
      isConnected: false,
      isMuted: false,
      isSessionActive: false,
    });
  const [micPermissionGranted, setMicPermissionGranted] =
    useState<boolean>(false);

  const [realtimeAvailable, setRealtimeAvailable] = useState<boolean>(false);

  useEffect(() => {
    const checkRealtimeAvailability = async () => {
      const providerSettings =
        await SettingsStorage.loadProviderSettingsByProviderId("openai");
      if (providerSettings && providerSettings.apiKey) {
        setRealtimeAvailable(true);
      }
    };

    checkRealtimeAvailability();

    const connection = new RealtimeConnection(setConnectionState);
    setRealtimeConnection(connection);

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
    if (realtimeConnection) {
      await realtimeConnection.startSession();
    }
  };

  const handleToggleMute = () => {
    if (realtimeConnection) {
      realtimeConnection.toggleMute();
    }
  };

  const handleEndSession = () => {
    if (realtimeConnection) {
      realtimeConnection.endSession();
    }
  };

  const getStatusMessage = () => {
    if (!micPermissionGranted) {
      return "Microphone permission required";
    }
    if (connectionState.error) {
      return "Error connecting to voice chat";
    }
    if (!connectionState.isSessionActive) {
      return "Ready to start voice chat";
    }
    if (!connectionState.isConnected) {
      return "Connecting...";
    }
    if (connectionState.isMuted) {
      return "Microphone is muted";
    }
    return "Voice chat is active";
  };

  return (
    <div className="flex flex-col items-center p-3">
      <div className="mb-2 p-3 rounded-lg w-full max-w-md text-center">
        <ConnectionStatus state={connectionState} />
        {realtimeAvailable ? (
          <div className="text-base">{getStatusMessage()}</div>
        ) : (
          <div>Realtime is not available (OpenAI API key not set)</div>
        )}
        <MicrophoneLevelIndicator state={connectionState} />
      </div>

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
