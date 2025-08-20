const BattleStats = ({
  onClose,
  battleCount,
  sessionDuration,
}: {
  onClose: () => void;
  battleCount: number;
  sessionDuration: number;
}) => {
  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-md p-6'>
        <h3 className='text-lg font-semibold mb-2'>Session stats</h3>
        <div className='space-y-2 text-sm text-gray-700'>
          <div className='flex items-center justify-between'>
            <span>Total battles</span>
            <span className='font-semibold'>{battleCount}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span>Duration</span>
            <span className='font-semibold'>{sessionDuration} min</span>
          </div>
        </div>
        <div className='mt-6 flex justify-end'>
          <button
            onClick={onClose}
            className='px-3 h-8 bg-gray-900 text-white rounded-lg text-xs hover:bg-gray-800'>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleStats;
