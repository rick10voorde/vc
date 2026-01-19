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
  statusText.textContent = "Listening...";

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
  statusText.textContent = "Processing...";

  // Stop STT
  sttClient.stop();
  sttClient = null;

  // Wait a bit for final transcript
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Refine and insert the text automatically
  if (fullTranscript.trim()) {
    try {
      statusText.textContent = "Refining...";
      const refined = await refineText(fullTranscript, currentProfile?.id);

      fullTranscript = refined;

      // Automatically insert the text
      await insertText(refined);
    } catch (error: any) {
      console.error("Refine error:", error);
      console.warn("⚠️ Refining failed, using raw transcript instead");

      // Fallback: use raw transcript if refining fails
      await insertText(fullTranscript);
    }
  } else {
    showError("No speech detected");
  }

  // Reset to idle state
  setTimeout(() => {
    setIndicatorState('idle');
    statusText.textContent = "Hold Ctrl+Shift+D";
    fullTranscript = "";
    partialTranscript = "";
  }, 2000);
}

function handleTranscript(text: string, isFinal: boolean) {
  if (isFinal) {
    // Add final transcript to full text
    fullTranscript += (fullTranscript ? " " : "") + text;
    partialTranscript = "";
    console.log("✓ Final transcript:", fullTranscript);
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
    statusText.textContent = "Hold Ctrl+Shift+D";
  }, 3000);
}

// Process voice commands
function processVoiceCommands(text: string): string {
  let processed = text;

  // Voice command mappings (case insensitive)
  const commands = [
    { pattern: /\b(nieuwe regel|new line)\b/gi, replacement: '\n' },
    { pattern: /\b(nieuwe paragraaf|new paragraph)\b/gi, replacement: '\n\n' },
    { pattern: /\b(punt|period)\b/gi, replacement: '.' },
    { pattern: /\b(komma|comma)\b/gi, replacement: ',' },
    { pattern: /\b(vraagteken|question mark)\b/gi, replacement: '?' },
    { pattern: /\b(uitroepteken|exclamation mark)\b/gi, replacement: '!' },
    { pattern: /\b(dubbele punt|colon)\b/gi, replacement: ':' },
    { pattern: /\b(puntkomma|semicolon)\b/gi, replacement: ';' },
    { pattern: /\b(gedachtestreepje|dash)\b/gi, replacement: ' - ' },
    { pattern: /\b(haakje open|open bracket)\b/gi, replacement: '(' },
    { pattern: /\b(haakje sluiten|close bracket)\b/gi, replacement: ')' },
  ];

  // Apply each command
  commands.forEach(({ pattern, replacement }) => {
    processed = processed.replace(pattern, replacement);
  });

  // Clean up extra spaces before punctuation
  processed = processed.replace(/\s+([.,!?:;])/g, '$1');

  // Ensure space after punctuation (except newlines)
  processed = processed.replace(/([.,!?:;])(?=[^\s\n])/g, '$1 ');

  console.log("Voice commands processed:", { original: text, processed });

  return processed;
}

async function insertText(text: string) {
  try {
    // Process voice commands
    const processedText = processVoiceCommands(text);

    // Write to clipboard
    await writeText(processedText);
    console.log("✓ Text written to clipboard:", processedText);

    // Automatically paste using Ctrl+V simulation
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("simulate_paste");

    statusText.textContent = "✓ Text inserted!";
    console.log("✓ Text automatically pasted");
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
      statusText.textContent = `Hold Ctrl+Shift+D`;
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
  console.log("✓ Hold Ctrl+Shift+D to dictate");
  console.log("📍 Indicator element:", indicator);
  console.log("📍 Status text:", statusText.textContent);
})();
