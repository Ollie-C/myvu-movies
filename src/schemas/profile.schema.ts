import { z } from 'zod';
import type { Database } from '@/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Profile Schema
export const ProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar_url: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
}) satisfies z.ZodType<ProfileRow>;

// Profile - Insert schema
export const ProfileInsertSchema = ProfileSchema;

// Profile - Update schema (all fields optional except id)
export const ProfileUpdateSchema = ProfileSchema.partial().required({
  id: true,
});

// Export types
export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileInsert = z.infer<typeof ProfileInsertSchema>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
