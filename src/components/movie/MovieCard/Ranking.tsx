// NOT AUDITED

interface MovieCardRankingProps {
  index: number;
}

export const MovieCardRanking = ({ index }: MovieCardRankingProps) => {
  return (
    <span
      className={`absolute top-[-8px] left-[-3px] text-xs text-gray-800 mb-1 text-center font-bold z-10 bg-white rounded-[2px] p-1 px-1.5 ${
        index < 3 ? 'text-[12px]' : 'text-[9px]'
      } ${index === 0 ? 'text-lg text-black' : ''}`}>
      {index + 1}
    </span>
  );
};
