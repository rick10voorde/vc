import { createClient } from "@/lib/supabase/server";
import type { AppProfile, AppProfileInsert, AppProfileUpdate } from "@/lib/types/database";

/**
 * Get all profiles for the current user
 */
export async function getProfiles(): Promise<AppProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('app_profiles')
    .select('*')
    .order('is_default', { ascending: false })
    .order('app_key', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single profile by ID
 */
export async function getProfile(id: string): Promise<AppProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('app_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get the default profile for the current user
 */
export async function getDefaultProfile(): Promise<AppProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('app_profiles')
    .select('*')
    .eq('is_default', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data || null;
}

/**
 * Create a new profile
 * If is_default is true, will unset other default profiles first
 */
export async function createProfile(profile: Omit<AppProfileInsert, 'user_id'>): Promise<AppProfile> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // If this is set as default, unset other defaults first
  if (profile.is_default) {
    await supabase
      .from('app_profiles')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true);
  }

  const { data, error } = await supabase
    .from('app_profiles')
    .insert({
      ...profile,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing profile
 * If is_default is set to true, will unset other default profiles first
 */
export async function updateProfile(id: string, updates: AppProfileUpdate): Promise<AppProfile> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // If setting this as default, unset other defaults first
  if (updates.is_default === true) {
    await supabase
      .from('app_profiles')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true)
      .neq('id', id);
  }

  const { data, error } = await supabase
    .from('app_profiles')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // Security: ensure user owns this profile
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a profile
 * Cannot delete if it's the only profile or if it's the default
 */
export async function deleteProfile(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if this is the default profile
  const profile = await getProfile(id);
  if (!profile) throw new Error('Profile not found');

  if (profile.is_default) {
    throw new Error('Cannot delete the default profile. Please set another profile as default first.');
  }

  // Count total profiles
  const { count } = await supabase
    .from('app_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (count && count <= 1) {
    throw new Error('Cannot delete your only profile.');
  }

  const { error } = await supabase
    .from('app_profiles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Security: ensure user owns this profile

  if (error) throw error;
}

/**
 * Set a profile as the default
 */
export async function setDefaultProfile(id: string): Promise<void> {
  await updateProfile(id, { is_default: true });
}
