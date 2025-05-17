import { useEffect, useRef, useState } from "react";
import { RealtimeConnectionState } from "./realtimeHandler";

interface MicrophoneLevelIndicatorProps {
  state: RealtimeConnectionState;
}

export const MicrophoneLevelIndicator = ({
  state,
}: MicrophoneLevelIndicatorProps) => {
  const { isSessionActive, isMuted } = state;
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isSessionActive && !isMuted) {
      startAudioAnalysis();
    } else {
      stopAudioAnalysis();
    }

    return () => {
      stopAudioAnalysis();
    };
  }, [isSessionActive, isMuted]);

  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Create audio context and analyzer
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      // Start animation loop
      updateAudioLevel();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;
    setAudioLevel(0);
  };

  const updateAudioLevel = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    // Calculate volume level (average of frequency data)
    const average =
      dataArrayRef.current.reduce((acc, val) => acc + val, 0) /
      dataArrayRef.current.length;
    const normalizedLevel = Math.min(1, average / 128); // Normalize to 0-1 range

    setAudioLevel(normalizedLevel);

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  // Don't render if not in a session
  if (!isSessionActive) {
    return null;
  }

  // Create array of level bars
  const bars = 5;
  const barElements = Array.from({ length: bars }).map((_, i) => {
    const threshold = i / bars;
    const isActive = audioLevel >= threshold;

    return (
      <div
        key={i}
        className={`w-1 rounded-sm bg-green-500 transition-all duration-100 ${
          isActive ? "opacity-100" : "opacity-30"
        }`}
        style={{ height: `${(i + 1) * 4}px` }}
      />
    );
  });

  return (
    <div className="flex items-center justify-center h-6">
      <div className="relative flex items-end gap-0.5">
        {barElements}
        {isMuted && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-5 h-5">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-destructive rounded-full transform -rotate-45"></div>
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-destructive rounded-full transform rotate-45"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
