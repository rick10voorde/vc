import { supabase, signIn, signUp, signOut, getCurrentUser } from "./lib/supabase";
import { getAppProfiles, ensureUserSettings } from "./lib/api";
import type { AppProfile } from "./lib/types";

console.log("✓ vochat.io desktop app starting...");

// DOM Elements
let authSection: HTMLElement;
let profileSection: HTMLElement;
let authForm: HTMLFormElement;
let signUpBtn: HTMLButtonElement;
let signOutBtn: HTMLButtonElement;
let emailInput: HTMLInputElement;
let passwordInput: HTMLInputElement;
let authError: HTMLElement;
let authStatus: HTMLElement;
let userEmail: HTMLElement;
let userEmailValue: HTMLElement;
let profilesList: HTMLElement;

// State
let currentUser: any = null;
let profiles: AppProfile[] = [];

// App initialization
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✓ DOM loaded");
  console.log("✓ Global hotkey: Ctrl + Win + Space");
  console.log("✓ System tray active");

  // Get DOM elements
  authSection = document.getElementById("authSection")!;
  profileSection = document.getElementById("profileSection")!;
  authForm = document.getElementById("authForm") as HTMLFormElement;
  signUpBtn = document.getElementById("signUpBtn") as HTMLButtonElement;
  signOutBtn = document.getElementById("signOutBtn") as HTMLButtonElement;
  emailInput = document.getElementById("emailInput") as HTMLInputElement;
  passwordInput = document.getElementById("passwordInput") as HTMLInputElement;
  authError = document.getElementById("authError")!;
  authStatus = document.getElementById("authStatus")!;
  userEmail = document.getElementById("userEmail")!;
  userEmailValue = document.getElementById("userEmailValue")!;
  profilesList = document.getElementById("profilesList")!;

  // Set up event listeners
  authForm.addEventListener("submit", handleSignIn);
  signUpBtn.addEventListener("click", handleSignUp);
  signOutBtn.addEventListener("click", handleSignOut);

  // Check for existing session
  await checkAuth();

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed:", event);
    if (session?.user) {
      currentUser = session.user;
      updateUIForAuthState(true);
      loadUserData();
    } else {
      currentUser = null;
      updateUIForAuthState(false);
    }
  });
});

async function checkAuth() {
  try {
    const user = await getCurrentUser();
    if (user) {
      currentUser = user;
      updateUIForAuthState(true);
      await loadUserData();
    } else {
      updateUIForAuthState(false);
    }
  } catch (error) {
    console.error("Error checking auth:", error);
    updateUIForAuthState(false);
  }
}

async function handleSignIn(e: Event) {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showAuthError("Please enter email and password");
    return;
  }

  try {
    authError.style.display = "none";
    await signIn(email, password);
    emailInput.value = "";
    passwordInput.value = "";
    console.log("✓ Signed in successfully");
  } catch (error: any) {
    console.error("Sign in error:", error);
    showAuthError(error.message || "Failed to sign in");
  }
}

async function handleSignUp() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showAuthError("Please enter email and password");
    return;
  }

  if (password.length < 6) {
    showAuthError("Password must be at least 6 characters");
    return;
  }

  try {
    authError.style.display = "none";
    await signUp(email, password);
    showAuthError("Check your email to confirm your account!");
    authError.style.color = "#51cf66";
    authError.style.display = "block";
    emailInput.value = "";
    passwordInput.value = "";
    console.log("✓ Signed up successfully");
  } catch (error: any) {
    console.error("Sign up error:", error);
    showAuthError(error.message || "Failed to sign up");
  }
}

async function handleSignOut() {
  try {
    await signOut();
    console.log("✓ Signed out");
  } catch (error: any) {
    console.error("Sign out error:", error);
    showAuthError(error.message || "Failed to sign out");
  }
}

function showAuthError(message: string) {
  authError.textContent = message;
  authError.style.color = "#ff6b6b";
  authError.style.display = "block";
}

function updateUIForAuthState(isAuthenticated: boolean) {
  if (isAuthenticated && currentUser) {
    // Show signed in state
    authStatus.textContent = "Signed in";
    authStatus.style.color = "#51cf66";
    userEmailValue.textContent = currentUser.email || "";
    userEmail.style.display = "flex";
    authSection.style.display = "none";
    profileSection.style.display = "block";
  } else {
    // Show signed out state
    authStatus.textContent = "Not signed in";
    authStatus.style.color = "#ff6b6b";
    userEmail.style.display = "none";
    authSection.style.display = "block";
    profileSection.style.display = "none";
  }
}

async function loadUserData() {
  try {
    // Skip user settings for now - focus on profiles
    // await ensureUserSettings();

    // Load app profiles
    profiles = await getAppProfiles();
    console.log("✓ Loaded profiles:", profiles);
    renderProfiles();
  } catch (error) {
    console.error("Error loading user data:", error);
    profilesList.innerHTML =
      '<p style="opacity: 0.7; text-align: center; color: #ff6b6b;">Failed to load profiles</p>';
  }
}

function renderProfiles() {
  if (profiles.length === 0) {
    profilesList.innerHTML = `
      <p style="opacity: 0.7; text-align: center;">
        No app profiles yet. Visit the web dashboard to create profiles.
      </p>
    `;
    return;
  }

  profilesList.innerHTML = profiles
    .map(
      (profile) => `
    <div style="padding: 10px; margin-bottom: 8px; border-radius: 6px; background: rgba(255,255,255,0.1); border: ${profile.is_default ? "2px solid #51cf66" : "1px solid rgba(255,255,255,0.2)"};">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600; text-transform: capitalize;">${profile.app_key}</div>
          <div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">
            ${profile.tone} · ${profile.language}
          </div>
        </div>
        ${profile.is_default ? '<div style="background: #51cf66; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">DEFAULT</div>' : ""}
      </div>
    </div>
  `
    )
    .join("");
}

// Prevent window close, minimize to tray instead
window.addEventListener("beforeunload", () => {
  console.log("Window closing, minimizing to tray");
});
