// Deepgram STT client for desktop app

interface STTToken {
  token: string;
  expiresAt: string;
  limits: {
    weeklyRefineWordsRemaining: number;
    isPro: boolean;
  };
}

export class DeepgramSTT {
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private onTranscript: (text: string, isFinal: boolean) => void;
  private onError: (error: string) => void;
  private apiUrl: string;
  private token: string = "";

  constructor(
    apiUrl: string,
    onTranscript: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void
  ) {
    this.apiUrl = apiUrl;
    this.onTranscript = onTranscript;
    this.onError = onError;
  }

  async start(profileId?: string) {
    try {
      // Get ephemeral token from backend
      const tokenResponse = await fetch(`${this.apiUrl}/api/stt/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          provider: "deepgram",
          profileId: profileId || null,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new Error(error.error || "Failed to get STT token");
      }

      const tokenData: STTToken = await tokenResponse.json();
      this.token = tokenData.token;
      console.log("✓ Received token:", this.token.substring(0, 20) + "...");

      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Connect to Deepgram WebSocket
      const deepgramUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=nl&punctuate=true&interim_results=true`;

      this.ws = new WebSocket(deepgramUrl, ['token', this.token]);

      this.ws.onopen = () => {
        console.log("✓ Connected to Deepgram");
        this.startRecording();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "Results") {
          const transcript = data.channel?.alternatives?.[0]?.transcript;
          const isFinal = data.is_final;

          if (transcript) {
            this.onTranscript(transcript, isFinal);
          }
        }
      };

      this.ws.onerror = (error) => {
        console.error("Deepgram WS error:", error);
        this.onError("Speech recognition connection failed");
      };

      this.ws.onclose = () => {
        console.log("✓ Deepgram connection closed");
      };
    } catch (error: any) {
      console.error("STT start error:", error);
      this.onError(error.message || "Failed to start speech recognition");
    }
  }

  private startRecording() {
    if (!this.stream || !this.ws) return;

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: "audio/webm",
    });

    this.mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(event.data);
      }
    });

    this.mediaRecorder.start(250); // Send chunks every 250ms
    console.log("✓ Recording started");
  }

  stop() {
    // Stop recording
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    // Stop mic stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // Close WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Send close message to finalize transcript
      this.ws.send(JSON.stringify({ type: "CloseStream" }));

      setTimeout(() => {
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }
      }, 500);
    }

    console.log("✓ Recording stopped");
  }

  isActive(): boolean {
    return (
      this.ws?.readyState === WebSocket.OPEN &&
      this.mediaRecorder?.state === "recording"
    );
  }
}
