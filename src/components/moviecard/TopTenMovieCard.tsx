import type { UserMovie } from '@/services/movie.service';

interface TopTenMovieCardProps {
  userMovie: UserMovie;
  disabled?: boolean;
  onClick?: () => void;
}

const TopTenMovieCard = ({
  userMovie,
  disabled = false,
  onClick,
}: TopTenMovieCardProps) => {
  const { movie } = userMovie;
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/placeholder-movie.jpg';

  return (
    <div
      className='flex flex-col items-center cursor-pointer rounded-lg transition-colors select-none'
      onClick={disabled ? undefined : onClick}
      title={movie.title}>
      <div className='w-auto h-auto bg-gray-200 rounded overflow-hidden flex items-center justify-center'>
        <img
          src={imageUrl}
          alt={movie.title}
          className='w-full h-full object-cover'
          draggable={false}
        />
      </div>
    </div>
  );
};

export default TopTenMovieCard;
