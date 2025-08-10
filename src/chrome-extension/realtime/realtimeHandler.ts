import { getOpenAIRealtimeSession } from "./sessionStart";
import { BASE_URL, MODEL } from "./constants";
import { RealtimeTools, TOOLS } from "./tools";
import { UIMessage } from "ai";
import { UseChatHelpers } from "@ai-sdk/react";
import { realtimeVoiceSystemMessage } from "../ai/prompts";

// Constants
const AGENT_RESPONSE_TIMEOUT_MS = 60000; // 60 second timeout in case there are user confirmed actions

export interface RealtimeConnectionState {
  isConnected: boolean;
  isMuted: boolean;
  isSessionActive: boolean;
  error?: string;
}

interface ToolCallOutput {
  response: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface ServerFunctionCall {
  type: "function_call";
  name: string;
  arguments: string;
  call_id: string;
}

export class RealtimeConnection {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private mediaStream: MediaStream | null = null;
  private audioTrack: MediaStreamTrack | null = null;
  private sendMessageToAgent: UseChatHelpers<UIMessage>["sendMessage"];
  public lastResponse: string | null = null;

  private onStateChange: (state: RealtimeConnectionState) => void;

  constructor(
    onStateChange: (state: RealtimeConnectionState) => void,
    append: UseChatHelpers<UIMessage>["sendMessage"]
  ) {
    this.onStateChange = onStateChange;
    this.sendMessageToAgent = append;
  }

  getState(): RealtimeConnectionState {
    return {
      isConnected:
        this.pc?.connectionState === "connected" ||
        this.pc?.iceConnectionState === "connected" ||
        this.pc?.iceConnectionState === "completed",
      isMuted: this.audioTrack ? !this.audioTrack.enabled : true,
      isSessionActive: this.pc !== null,
      error: undefined,
    };
  }

  async startSession() {
    try {
      // Get session from OpenAI
      const sessionResponse = await getOpenAIRealtimeSession();

      if ("error" in sessionResponse) {
        this.onStateChange({
          ...this.getState(),
          error: sessionResponse.error,
        });
        return;
      }

      // Create peer connection
      this.pc = new RTCPeerConnection();

      this.onStateChange(this.getState());

      // Add connection state change listener
      this.pc.onconnectionstatechange = () => {
        console.log("Connection state changed:", this.pc?.connectionState);
        this.onStateChange(this.getState());
      };

      // Add ICE connection state change listener
      this.pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", this.pc?.iceConnectionState);
        this.onStateChange(this.getState());
      };

      // Set up audio element for remote audio
      this.audioElement = document.createElement("audio");
      this.audioElement.autoplay = true;

      // Handle incoming audio tracks
      this.pc.ontrack = (e) => {
        if (this.audioElement) {
          this.audioElement.srcObject = e.streams[0];
        }
      };

      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      } catch (error) {
        console.error("Microphone access error:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (
          errorMessage.includes("Permission") ||
          errorMessage.includes("permission")
        ) {
          this.onStateChange({
            ...this.getState(),
            error:
              "Microphone permission denied. Please allow microphone access.",
          });
        } else {
          this.onStateChange({
            ...this.getState(),
            error: `Error accessing microphone: ${errorMessage}`,
          });
        }
        return;
      }

      // Add the audio track to the peer connection
      this.audioTrack = this.mediaStream.getAudioTracks()[0];
      this.pc.addTrack(this.audioTrack, this.mediaStream);

      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.addEventListener("message", this.handleServerMessage);

      const systemPrompt = await realtimeVoiceSystemMessage();

      this.dc.onopen = () => {
        console.log("Data channel opened. Sending tool configuration.");
        const sessionConfig = {
          type: "session.update",
          session: {
            tools: TOOLS,
            instructions: systemPrompt,
          },
        };
        this.sendDataChannelMessage(sessionConfig);
      };

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      const sdpResponse = await fetch(`${BASE_URL}?model=${MODEL}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${sessionResponse.client_secret.value}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };

      await this.pc.setRemoteDescription(answer as RTCSessionDescriptionInit);

      this.onStateChange(this.getState());
    } catch (error) {
      console.error("Error starting session:", error);
      this.onStateChange({
        ...this.getState(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  toggleMute() {
    if (this.audioTrack) {
      this.audioTrack.enabled = !this.audioTrack.enabled;
      this.onStateChange(this.getState());
    }
  }

  endSession() {
    // Close data channel
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }

    // Close peer connection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    // Stop all media tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
      this.audioTrack = null;
    }

    // Clean up audio element
    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement = null;
    }

    // Update state
    this.onStateChange({
      isConnected: false,
      isMuted: true,
      isSessionActive: false,
    });
  }

  private handleServerMessage = (event: MessageEvent) => {
    try {
      const serverEvent = JSON.parse(event.data);
      //console.log("Server event:", serverEvent);

      if (
        serverEvent.type === "response.done" &&
        serverEvent.response &&
        serverEvent.response.output &&
        serverEvent.response.output.length > 0
      ) {
        const output = serverEvent.response.output[0];
        if (output && output.type === "function_call") {
          this.handleToolCall(output as ServerFunctionCall);
        }
      }
    } catch (error) {
      console.error("Error parsing server message:", error);
    }
  };

  private async handleToolCall(toolCall: ServerFunctionCall) {
    console.log("Handling tool call:", toolCall);
    const { name, call_id, arguments: func_arguments } = toolCall;

    let toolCallOutputResult: ToolCallOutput = {
      response: `Tool ${name} executed.`, // Default response
    };

    if (name === RealtimeTools.PASS_TO_AGENT) {
      console.log("Downstream agent called with args:", func_arguments);
      try {
        const args = JSON.parse(func_arguments) as { agentTask: string };
        const realtimeMessage = {
          id: crypto.randomUUID(),
          role: "user",
          parts: [{ type: "text", text: args.agentTask }],
        } satisfies UIMessage;

        this.lastResponse = null;
        // This awaits until message is sent and received, but doesn't return actual response
        await this.sendMessageToAgent(realtimeMessage);

        // Wait for response with timeout
        const startTime = Date.now();
        while (this.lastResponse === null) {
          await new Promise((resolve) => setTimeout(resolve, 100));

          if (Date.now() - startTime > AGENT_RESPONSE_TIMEOUT_MS) {
            console.warn("Timeout waiting for agent response");
            break;
          }
        }

        console.log("Agent response:", this.lastResponse);

        toolCallOutputResult = {
          response:
            this.lastResponse || "No response from agent (timeout reached)",
        };
      } catch (error) {
        console.error("Error when calling agent:", error);
        toolCallOutputResult.response = `Error when calling agent: ${error}`;
      }
    } else {
      console.warn(`Unknown tool called: ${name}`);
      toolCallOutputResult.response = `Unknown tool: ${name}`;
    }

    const responseEvent = {
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: call_id,
        output: JSON.stringify(toolCallOutputResult),
      },
    };
    this.sendDataChannelMessage(responseEvent);

    this.sendDataChannelMessage({
      type: "response.create",
    });
  }

  private sendDataChannelMessage(payload: object) {
    if (this.dc && this.dc.readyState === "open") {
      const messageToSend = { ...payload, event_id: crypto.randomUUID() };
      this.dc.send(JSON.stringify(messageToSend));
      console.log("Sent DC message:", messageToSend);
    } else {
      console.error(
        "Failed to send message - data channel not open or available.",
        payload
      );
    }
  }
}
