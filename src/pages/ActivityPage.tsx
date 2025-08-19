import { useMemo, useState } from 'react';
import { useActivities } from '@/utils/hooks/supabase/queries/useUserActivity';
import type { ActivityType } from '@/services/supabase/activity.service';
import { Link } from 'react-router-dom';

const ALL_TYPES: ActivityType[] = [
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
];

export default function ActivityPage() {
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([]);
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, isLoading } = useActivities({
    types: selectedTypes.length ? selectedTypes : undefined,
    page,
    limit,
  });

  const total = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const activities = data?.data || [];

  const toggleType = (type: ActivityType) => {
    setPage(1);
    setSelectedTypes((curr) =>
      curr.includes(type) ? curr.filter((t) => t !== type) : [...curr, type]
    );
  };

  const typeLabel = (t: ActivityType) =>
    t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const renderLabel = (act: any) => {
    switch (act.type as ActivityType) {
      case 'watched_added':
        return `Marked watched: ${act.movie?.title || 'movie'}`;
      case 'watched_removed':
        return `Unmarked watched: ${act.movie?.title || 'movie'}`;
      case 'rated_movie':
        return `Rated ${act.movie?.title || 'movie'} ${
          act.metadata?.rating ?? ''
        }/10`;
      case 'favorite_added':
        return `Added to Top 10: ${act.movie?.title || 'movie'}`;
      case 'favorite_removed':
        return `Removed from Top 10: ${act.movie?.title || 'movie'}`;
      case 'notes_updated':
        return `Updated notes for ${act.movie?.title || 'an item'}`;
      case 'watchlist_added':
        return `Added to watchlist: ${act.movie?.title || 'movie'}`;
      case 'watchlist_removed':
        return `Removed from watchlist: ${act.movie?.title || 'movie'}`;
      case 'watchlist_priority_updated':
        return `Updated watchlist priority: ${act.movie?.title || 'movie'}`;
      case 'collection_created':
        return `Created collection: ${act.collection?.name || 'collection'}`;
      case 'collection_updated':
        return `Updated collection: ${act.collection?.name || 'collection'}`;
      case 'collection_movie_added':
        return `Added ${act.movie?.title || 'movie'} to ${
          act.collection?.name || 'collection'
        }`;
      case 'collection_movie_removed':
        return `Removed ${act.movie?.title || 'movie'} from ${
          act.collection?.name || 'collection'
        }`;
      case 'ranking_battle':
        return `Completed a Versus battle`;
      case 'top_ten_changed':
        return `Updated Top 10`;
      default:
        return 'Activity';
    }
  };

  return (
    <div className='mx-auto px-0 py-8'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-semibold text-gray-900'>Activity</h1>
        <Link to='/' className='text-sm text-gray-500 hover:text-gray-700'>
          Back to dashboard
        </Link>
      </div>

      <div className='bg-white border border-gray-200 rounded-lg p-4 mb-4'>
        <div className='flex flex-wrap gap-2'>
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={
                'px-3 py-1 rounded-full border text-sm ' +
                (selectedTypes.includes(t)
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400')
              }>
              {typeLabel(t)}
            </button>
          ))}
        </div>
      </div>

      <div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
        <div className='grid grid-cols-12 text-xs text-gray-500 border-b border-gray-100 px-4 py-2'>
          <div className='col-span-3'>Date</div>
          <div className='col-span-3'>Type</div>
          <div className='col-span-6'>Details</div>
        </div>
        {isLoading ? (
          <div className='p-8 text-center text-gray-500'>Loading...</div>
        ) : activities.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>No activity found</div>
        ) : (
          activities.map((act) => {
            const link = act.movie_id
              ? `/movies/${act.movie_id}`
              : act.collection_id
              ? `/collections/${act.collection_id}`
              : undefined;
            return (
              <div
                key={act.id}
                className='grid grid-cols-12 px-4 py-3 border-b border-gray-100 text-sm'>
                <div className='col-span-3 text-gray-600'>
                  {new Date(act.created_at).toLocaleString()}
                </div>
                <div className='col-span-3'>
                  {typeLabel(act.type as ActivityType)}
                </div>
                <div className='col-span-6'>
                  {link ? (
                    <Link to={link} className='text-gray-900 hover:underline'>
                      {renderLabel(act)}
                    </Link>
                  ) : (
                    <span className='text-gray-900'>{renderLabel(act)}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className='flex items-center justify-between mt-4'>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className='px-3 py-1 border border-gray-300 rounded disabled:opacity-50'>
          Previous
        </button>
        <div className='text-sm text-gray-600'>
          Page {page} of {totalPages}
        </div>
        <button
          onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
          disabled={page >= totalPages}
          className='px-3 py-1 border border-gray-300 rounded disabled:opacity-50'>
          Next
        </button>
      </div>
    </div>
  );
}
