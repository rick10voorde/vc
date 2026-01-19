"use server";

import { revalidatePath } from "next/cache";
import { deleteProfile, setDefaultProfile, createProfile, updateProfile } from "@/lib/api/profiles";
import type { AppProfileInsert, AppProfileUpdate } from "@/lib/types/database";

export async function deleteProfileAction(id: string) {
  await deleteProfile(id);
  revalidatePath("/dashboard/profiles");
}

export async function setDefaultProfileAction(id: string) {
  await setDefaultProfile(id);
  revalidatePath("/dashboard/profiles");
}

export async function createProfileAction(data: Omit<AppProfileInsert, 'user_id'>) {
  const profile = await createProfile(data);
  revalidatePath("/dashboard/profiles");
  return profile;
}

export async function updateProfileAction(id: string, data: AppProfileUpdate) {
  const profile = await updateProfile(id, data);
  revalidatePath("/dashboard/profiles");
  revalidatePath(`/dashboard/profiles/${id}/edit`);
  return profile;
}
