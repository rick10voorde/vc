// Database types
export type AppKey =
  | "generic"
  | "slack"
  | "gmail"
  | "docs"
  | "terminal"
  | "notion"
  | "discord"
  | "teams"
  | "linkedin";

export type Tone =
  | "professional"
  | "casual"
  | "friendly"
  | "direct"
  | "technical"
  | "empathetic"
  | "formal";

export type Language = "en-US" | "en-GB" | "es-ES" | "fr-FR" | "de-DE" | "nl-NL";

export interface ProfileFormatting {
  bullets?: boolean;
  max_length?: number;
  capitalization?: "preserve" | "sentence" | "title" | "lower" | "upper";
  paragraphs?: boolean;
  preserve_code?: boolean;
}

export interface AppProfile {
  id: string;
  user_id: string;
  app_key: AppKey;
  tone: Tone;
  language: Language;
  formatting: ProfileFormatting;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  stt_provider: "deepgram" | "assemblyai";
  ai_provider: "openai" | "claude";
  auto_insert: boolean;
  show_overlay: boolean;
  created_at: string;
  updated_at: string;
}
