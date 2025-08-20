import { z } from 'zod';
import type { Database, Json } from '@/types/database.types';
import { MovieSchema } from '@/schemas/movie.schema';
import { CollectionSchema } from '@/schemas/collection.schema';

type ActivityRow = Database['public']['Tables']['activities']['Row'];

export const ActivityTypeEnum = z.enum([
  'watched_added',
  'watched_removed',
  'rated_movie',
  'favorite_added',
  'favorite_removed',
  'notes_updated',
  'watchlist_added',
  'watchlist_removed',
  'watchlist_priority_updated',
  'collection_created',
  'collection_updated',
  'collection_movie_added',
  'collection_movie_removed',
  'ranking_battle',
  'top_ten_changed',
]);

export const ActivitySchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  type: ActivityTypeEnum,
  movie_id: z.uuid().nullable(),
  collection_id: z.uuid().nullable(),
  ranking_list_id: z.uuid().nullable(),
  metadata: ((): z.ZodType<Json> => {
    const JsonSchema: z.ZodType<Json> = z.lazy(() =>
      z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.null(),
        z.array(JsonSchema),
        z.record(z.string(), JsonSchema.optional()),
      ])
    );
    return JsonSchema;
  })().default({}),
  created_at: z.string(),
}) satisfies z.ZodType<ActivityRow>;

export const ActivityInsertSchema = ActivitySchema.pick({
  user_id: true,
  type: true,
  movie_id: true,
  collection_id: true,
  ranking_list_id: true,
  metadata: true,
}).partial({
  movie_id: true,
  collection_id: true,
  ranking_list_id: true,
  metadata: true,
});

export type Activity = z.infer<typeof ActivitySchema>;
export type ActivityInsert = z.infer<typeof ActivityInsertSchema>;

export const ActivityWithEntitiesSchema = ActivitySchema.extend({
  movie: MovieSchema.nullable().optional(),
  collection: CollectionSchema.nullable().optional(),
});
export type ActivityWithEntities = z.infer<typeof ActivityWithEntitiesSchema>;
