import { supabase } from './supabase';
import type { AppProfile, UserSettings } from './types';

// Fetch all app profiles for the current user
export async function getAppProfiles(): Promise<AppProfile[]> {
  const { data, error } = await supabase
    .from('app_profiles')
    .select('*')
    .order('app_key');

  if (error) throw error;
  return data || [];
}

// Fetch the default profile
export async function getDefaultProfile(): Promise<AppProfile | null> {
  const { data, error } = await supabase
    .from('app_profiles')
    .select('*')
    .eq('is_default', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}

// Fetch user settings
export async function getUserSettings(): Promise<UserSettings | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Create default user settings if they don't exist
export async function ensureUserSettings(): Promise<UserSettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const existingSettings = await getUserSettings();

  if (existingSettings) {
    return existingSettings;
  }

  // Create new settings
  const { data, error } = await supabase
    .from('user_settings')
    .insert({
      user_id: user.id,
      stt_provider: 'deepgram',
      ai_provider: 'claude',
      auto_insert: true,
      show_overlay: true,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create user settings');

  return data;
}
