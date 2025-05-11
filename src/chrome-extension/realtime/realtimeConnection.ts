import { getOpenAIRealtimeSession } from "./sessionStart";
import { AGENT_SYSTEM_PROMPT, BASE_URL, MODEL } from "./constants";
import { RealtimeTools, TOOLS } from "./tools";
import { getTextResponse } from "../ai/ai";
import { CoreMessage } from "ai";

export interface RealtimeConnectionState {
  isConnected: boolean;
  isMuted: boolean;
  isSessionActive: boolean;
  error?: string;
}

interface ToolCallOutput {
  response: string;
  [key: string]: any;
}

interface ServerFunctionCall {
  type: "function_call";
  name: string;
  arguments: string;
  call_id: string;
}

interface AgentState {
  [key: string]: {
    messages: CoreMessage[];
  };
}

export class RealtimeConnection {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private mediaStream: MediaStream | null = null;
  private audioTrack: MediaStreamTrack | null = null;
  private sessionId: string | null = null;
  private agentState: AgentState = {};
  private onStateChange: (state: RealtimeConnectionState) => void;

  constructor(onStateChange: (state: RealtimeConnectionState) => void) {
    this.onStateChange = onStateChange;
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

  addMessageToAgentState(sessionId: string, message: CoreMessage) {
    if (!this.agentState[sessionId]) {
      this.agentState[sessionId] = {
        messages: [],
      };
    }

    this.agentState[sessionId].messages.push(message);
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

      this.sessionId = sessionResponse.id;

      this.agentState = {
        [this.sessionId]: {
          messages: [],
        },
      };

      // Create peer connection
      this.pc = new RTCPeerConnection();

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

      this.dc.onopen = () => {
        console.log("Data channel opened. Sending tool configuration.");
        const sessionConfig = {
          type: "session.update",
          session: {
            tools: TOOLS,
            instructions: "", // Initialize with empty instructions or a default
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
          role: "user",
          content: args.agentTask,
        } satisfies CoreMessage;

        if (!this.sessionId) {
          throw new Error("Session ID not found");
        }

        this.addMessageToAgentState(this.sessionId, realtimeMessage);
        const agentResponse = await getTextResponse(
          this.agentState[this.sessionId].messages,
          { systemPrompt: AGENT_SYSTEM_PROMPT }
        );

        toolCallOutputResult = {
          response: agentResponse,
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
