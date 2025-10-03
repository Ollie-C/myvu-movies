type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

interface MovieCastProps {
  cast: CastMember[];
}

export default function MovieCast({ cast }: MovieCastProps) {
  if (!cast.length) return null;
  return (
    <section className='space-y-4'>
      <h2 className='text-xl font-bold'>Cast</h2>
      <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4'>
        {cast.map((member) => (
          <div key={member.id} className='text-center'>
            {member.profile_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                alt={member.name}
                className='rounded-lg mb-2'
              />
            ) : (
              <div className='bg-gray-700 h-32 rounded-lg mb-2' />
            )}
            <p className='text-sm font-semibold'>{member.name}</p>
            <p className='text-xs text-secondary'>{member.character}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
