// NOT AUDITED

import React from 'react';
import { tmdb } from '@/lib/api/tmdb';
import { Card } from '@/components/common/Card';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface MovieCastProps {
  cast: CastMember[];
}

const MovieCast: React.FC<MovieCastProps> = ({ cast }) => {
  // Take only the first 12 cast members (most important ones)
  const displayCast = cast.slice(0, 12);

  if (!displayCast.length) {
    return null;
  }

  return (
    <Card className='p-6'>
      <h2 className='text-xl font-bold mb-6'>Cast</h2>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
        {displayCast.map((member) => {
          const profileUrl = member.profile_path
            ? tmdb.getImageUrl(member.profile_path, 'w200')
            : '/placeholder-avatar.jpg';

          return (
            <div key={member.id} className='text-center'>
              {/* Profile Image */}
              <div className='relative mb-3'>
                <img
                  src={profileUrl}
                  alt={member.name}
                  className='w-20 h-20 md:w-24 md:h-24 rounded-full object-cover mx-auto shadow-md'
                  loading='lazy'
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-avatar.jpg';
                  }}
                />
              </div>

              {/* Actor Name */}
              <h3 className='font-semibold text-sm text-gray-900 mb-1 line-clamp-2'>
                {member.name}
              </h3>

              {/* Character Name */}
              <p className='text-xs text-gray-600 line-clamp-2'>
                {member.character}
              </p>
            </div>
          );
        })}
      </div>

      {/* Show more link if there are more cast members */}
      {cast.length > 12 && (
        <div className='mt-6 text-center'>
          <button className='text-sm text-blue-600 hover:text-blue-800 transition-colors'>
            View full cast ({cast.length} members)
          </button>
        </div>
      )}
    </Card>
  );
};

export default MovieCast;
