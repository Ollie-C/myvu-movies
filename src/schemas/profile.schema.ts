import { z } from 'zod';
import type { Database } from '@/types/database.types';

// Get the type from Supabase
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Create Zod schema matching the database
export const ProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar_url: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
}) satisfies z.ZodType<ProfileRow>;

// Create insert schema
export const ProfileInsertSchema = ProfileSchema;

// Create update schema (all fields optional except id)
export const ProfileUpdateSchema = ProfileSchema.partial().required({
  id: true,
});

// Export types
export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileInsert = z.infer<typeof ProfileInsertSchema>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
