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
  private closeResolve: (() => void) | null = null;

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

      // Get microphone access with high-quality audio settings
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        }
      });

      // Connect to Deepgram WebSocket with optimized parameters for Dutch
      const deepgramUrl = `wss://api.deepgram.com/v1/listen?` + new URLSearchParams({
        model: 'nova-2',
        language: 'nl',
        punctuate: 'true',
        smart_format: 'true',              // Helps with formatting names and special terms
        interim_results: 'true',
        endpointing: '1000',
        vad_events: 'true',
      }).toString();

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
        if (this.closeResolve) {
          this.closeResolve();
          this.closeResolve = null;
        }
      };
    } catch (error: any) {
      console.error("STT start error:", error);
      this.onError(error.message || "Failed to start speech recognition");
    }
  }

  private startRecording() {
    if (!this.stream || !this.ws) return;

    // Use best available audio format
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: mimeType,
      audioBitsPerSecond: 128000,
    });

    this.mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(event.data);
      }
    });

    // Send smaller chunks for faster response (100ms instead of 250ms)
    this.mediaRecorder.start(100);
    console.log("✓ Recording started with", mimeType);
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

  // Wait for WebSocket to fully close and receive all final transcripts
  waitForClose(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        // Already closed
        resolve();
      } else {
        // Wait for onclose event
        this.closeResolve = resolve;
        // Timeout after 5 seconds just in case
        setTimeout(() => {
          if (this.closeResolve) {
            console.warn("⚠️ WebSocket close timeout reached");
            this.closeResolve();
            this.closeResolve = null;
          }
        }, 5000);
      }
    });
  }

  isActive(): boolean {
    return (
      this.ws?.readyState === WebSocket.OPEN &&
      this.mediaRecorder?.state === "recording"
    );
  }
}
