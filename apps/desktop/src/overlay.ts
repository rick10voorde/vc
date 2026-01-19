import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { getCurrentUser } from "./lib/supabase";
import { getDefaultProfile } from "./lib/api";
import { DeepgramSTT } from "./lib/stt";
import { refineText } from "./lib/refine";
import type { AppProfile } from "./lib/types";

// State
let fullTranscript = "";
let partialTranscript = "";
let currentProfile: AppProfile | null = null;
let isAuthenticated = false;
let sttClient: DeepgramSTT | null = null;
let isRecording = false;

// Elements
const indicator = document.getElementById("indicator")!;
const statusText = document.getElementById("statusText")!;

// API URL
const API_URL = "http://localhost:3002";

// Position window at bottom center of screen
async function positionWindow() {
  const window = getCurrentWindow();

  try {
    // Use availableMonitors to get primary monitor
    const { availableMonitors } = await import("@tauri-apps/api/window");
    const monitors = await availableMonitors();

    if (monitors && monitors.length > 0) {
      const monitor = monitors[0]; // Primary monitor
      const screenWidth = monitor.size.width;
      const screenHeight = monitor.size.height;
      const windowWidth = 280;
      const windowHeight = 70;

      const x = Math.floor((screenWidth - windowWidth) / 2);
      const y = Math.floor(screenHeight - windowHeight - 80); // 80px from bottom

      console.log(`📍 Positioning window at x=${x}, y=${y} (screen: ${screenWidth}x${screenHeight})`);

      await window.setPosition({ type: 'Physical', x, y });
      await window.setSize({ type: 'Physical', width: windowWidth, height: windowHeight });
    } else {
      // Fallback if no monitors found
      console.warn("No monitors found, using fallback position");
      await window.setPosition({ type: 'Physical', x: 500, y: 800 });
    }
  } catch (error) {
    console.error("Error positioning window:", error);
    // Fallback position
    await window.setPosition({ type: 'Physical', x: 500, y: 800 });
  }
}

// Set indicator state
function setIndicatorState(state: 'idle' | 'recording' | 'processing' | 'error') {
  indicator.className = `indicator ${state}`;
}

// Main recording logic - listen to global shortcut events
let holdTimer: number | null = null;
const HOLD_THRESHOLD = 200; // ms - must hold for 200ms to start recording

// Setup event listeners
async function setupEventListeners() {
  // Listen for global shortcut pressed
  await listen("hotkey-pressed", () => {
    console.log("✓ Hotkey pressed event received!");

    if (!isRecording && !holdTimer) {
      holdTimer = window.setTimeout(() => {
        console.log("✓ Hold threshold reached, starting recording...");
        startRecording();
      }, HOLD_THRESHOLD);
    }
  });

  // Listen for global shortcut released
  await listen("hotkey-released", () => {
    console.log("✓ Hotkey released event received!");

    // Clear hold timer if released before threshold
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }

    // Stop recording if was active
    if (isRecording) {
      stopRecording();
    }
  });

  console.log("✓ Event listeners registered");
}

async function startRecording() {
  if (!isAuthenticated) {
    showError("Please sign in first");
    return;
  }

  isRecording = true;
  fullTranscript = "";
  partialTranscript = "";

  setIndicatorState('recording');
  statusText.textContent = "Recording";

  // Longer delay to prevent hotkey keys (Alt+Z) from being captured
  await new Promise((resolve) => setTimeout(resolve, 150));

  try {
    // Initialize STT client
    sttClient = new DeepgramSTT(
      API_URL,
      handleTranscript,
      handleSTTError
    );

    await sttClient.start(currentProfile?.id);
  } catch (error: any) {
    console.error("Failed to start recording:", error);
    showError(error.message || "Failed to start recording");
    isRecording = false;
    setIndicatorState('idle');
  }
}

async function stopRecording() {
  if (!sttClient || !isRecording) return;

  isRecording = false;
  setIndicatorState('processing');
  statusText.textContent = "Processing";

  // Stop STT and wait for WebSocket to close (all final transcripts will arrive before close)
  const client = sttClient; // Keep reference
  sttClient.stop();
  sttClient = null;

  console.log("⏳ Waiting for all transcripts to arrive...");
  await client.waitForClose();
  console.log("✓ WebSocket closed, all transcripts received");

  // Combine full transcript + any remaining partial (in case final didn't arrive yet)
  const completeTranscript = fullTranscript + (partialTranscript ? (fullTranscript ? " " : "") + partialTranscript : "");

  // Insert raw transcript directly (no AI refinement)
  if (completeTranscript.trim()) {
    console.log("📋 Inserting complete transcript:", completeTranscript);
    console.log("   - Final parts:", fullTranscript);
    console.log("   - Partial (unfinalised):", partialTranscript);
    await insertText(completeTranscript);
  } else {
    console.log("⚠️ No speech detected");
    showError("No speech detected");
  }

  // Note: We don't auto-pause/resume media anymore
  // MediaPlayPause is a toggle and causes issues (can start Spotify when nothing was playing)
  // User can manually pause/resume their media if needed

  // Reset to idle state
  setTimeout(() => {
    setIndicatorState('idle');
    statusText.textContent = "Hold Alt+Z";
    fullTranscript = "";
    partialTranscript = "";
  }, 2000);
}

function handleTranscript(text: string, isFinal: boolean) {
  if (isFinal) {
    // Add final transcript to full text (multiple finals can come in during one recording)
    fullTranscript += (fullTranscript ? " " : "") + text;
    partialTranscript = "";
    console.log("✓ Final transcript part received:", text);
    console.log("   Full transcript so far:", fullTranscript);
  } else {
    // Update partial transcript (interim results)
    partialTranscript = text;
    const displayText = fullTranscript + (fullTranscript ? " " : "") + partialTranscript;
    console.log("Interim:", displayText);
  }
}

function handleSTTError(error: string) {
  console.error("STT error:", error);
  showError(error);
  isRecording = false;
  setIndicatorState('error');
}

function showError(message: string) {
  setIndicatorState('error');
  statusText.textContent = message;

  setTimeout(() => {
    setIndicatorState('idle');
    statusText.textContent = "Hold Alt+Z";
  }, 3000);
}


// Fix common tech/English words that Dutch STT gets wrong
function fixTechTerms(text: string): string {
  const corrections: Record<string, string> = {
    // Git & GitHub
    'gids': 'git',
    'git hub': 'GitHub',
    'get hub': 'GitHub',
    'get-up': 'GitHub',
    'github': 'GitHub',

    // Common commands
    'pus': 'push',
    'pol': 'pull',
    'commits': 'commit',
    'kloon': 'clone',
    'merge': 'merge',
    'branch': 'branch',

    // Programming terms
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'react': 'React',
    'node': 'Node',
    'npm': 'npm',
    'api': 'API',
    'json': 'JSON',
    'html': 'HTML',
    'css': 'CSS',

    // Common tech words
    'database': 'database',
    'server': 'server',
    'client': 'client',
    'code': 'code',
    'debug': 'debug',
    'deploy': 'deploy',
  };

  let corrected = text;

  // Replace each term (case-insensitive but preserve original if already correct)
  Object.entries(corrections).forEach(([wrong, right]) => {
    // Match whole words only (with word boundaries)
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    corrected = corrected.replace(regex, right);
  });

  if (corrected !== text) {
    console.log("🔧 Tech terms corrected:", { original: text, corrected });
  }

  return corrected;
}

async function insertText(text: string) {
  try {
    // Fix common tech terms that Dutch STT gets wrong
    const correctedText = fixTechTerms(text);

    // Write to clipboard
    await writeText(correctedText);
    console.log("✓ Text written to clipboard:", correctedText);

    // Hide overlay to ensure previous window regains focus
    const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    const window = getCurrentWebviewWindow();
    await window.hide();
    console.log("👁️ Overlay hidden to restore focus");

    // Give more time for previous window to regain focus (especially terminals)
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Automatically paste using Ctrl+V simulation
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("simulate_paste");
    console.log("✓ Text automatically pasted");

    // Show overlay again briefly to show success
    await window.show();
    statusText.textContent = "Inserted";

    // Hide again after 1 second
    setTimeout(async () => {
      await window.hide();
    }, 1000);

  } catch (error) {
    console.error("Failed to insert text:", error);
    showError("Failed to insert text");
  }
}

// Initialize on load
async function loadProfile() {
  try {
    const user = await getCurrentUser();
    isAuthenticated = !!user;

    if (isAuthenticated) {
      currentProfile = await getDefaultProfile();
      console.log(
        "✓ Loaded profile:",
        currentProfile?.app_key || "No default profile"
      );
      statusText.textContent = `Hold Alt+Z`;
    } else {
      statusText.textContent = "Please sign in first";
      setIndicatorState('error');
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    statusText.textContent = "Error loading profile";
    setIndicatorState('error');
  }
}

// Initialize
(async () => {
  console.log("🔧 Initializing overlay...");

  try {
    await positionWindow();
    console.log("✓ Window positioned");
  } catch (error) {
    console.error("Failed to position window:", error);
  }

  await setupEventListeners();
  await loadProfile();

  console.log("✓ vochat.io indicator ready");
  console.log("✓ Hold Alt+Z to dictate");
  console.log("📍 Indicator element:", indicator);
  console.log("📍 Status text:", statusText.textContent);
})();
