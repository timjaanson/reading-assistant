import { RealtimeConnectionState } from "./realtimeHandler";

interface ConnectionStatusProps {
  state: RealtimeConnectionState;
  hideText?: boolean;
}

export const ConnectionStatus = ({
  state,
  hideText = false,
}: ConnectionStatusProps) => {
  const { isConnected, isSessionActive, error } = state;

  // Determine the status color class based on connection state
  let statusColorClass = "bg-gray-300"; // Default gray
  if (error) {
    statusColorClass = "bg-red-500"; // Red for error
  } else if (isConnected) {
    statusColorClass = "bg-green-500"; // Green for connected
  } else if (isSessionActive) {
    statusColorClass = "bg-yellow-500"; // Yellow for connecting
  }

  return (
    <div
      className={`flex items-center justify-center ${
        !hideText && "mb-2"
      } text-sm font-medium`}
    >
      <div
        className={`w-3 h-3 rounded-full inline-block ${
          !hideText && "mr-2"
        } ${statusColorClass}`}
      />
      {!hideText && (
        <span>
          {error
            ? "Error"
            : isConnected
            ? "Connected"
            : isSessionActive
            ? "Connecting..."
            : "Disconnected"}
        </span>
      )}
    </div>
  );
};
