import { RealtimeConnectionState } from "./realtimeConnection";

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

  return (
    <div className="w-full max-w-md">
      {error && (
        <div className="text-red-600 bg-red-100 p-2 rounded mb-4 text-center">
          {error}
        </div>
      )}

      <div className="flex justify-center gap-4">
        {!isSessionActive ? (
          <button
            className="flex flex-col items-center justify-center p-4 w-20 h-20 rounded-full bg-green-500 text-white text-xs font-medium transition-transform hover:scale-105 active:scale-95"
            onClick={onStartSession}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mb-1"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            Start Chat
          </button>
        ) : (
          <>
            <button
              className={`flex flex-col items-center justify-center p-4 w-20 h-20 rounded-full text-white text-xs font-medium transition-transform hover:scale-105 active:scale-95 ${
                isMuted ? "bg-red-500" : "bg-blue-500"
              } ${!isConnected && "opacity-50 cursor-not-allowed"}`}
              onClick={onToggleMute}
              disabled={!isConnected}
            >
              {isMuted ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mb-1"
                >
                  <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mb-1"
                >
                  <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                </svg>
              )}
              {isMuted ? "Unmute" : "Mute"}
            </button>

            <button
              className="flex flex-col items-center justify-center p-4 w-20 h-20 rounded-full bg-red-500 text-white text-xs font-medium transition-transform hover:scale-105 active:scale-95"
              onClick={onEndSession}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mb-1"
              >
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
              End Chat
            </button>
          </>
        )}
      </div>
    </div>
  );
};
