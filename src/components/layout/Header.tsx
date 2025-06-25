import { Search, User, X } from 'lucide-react';
import { Input } from '../common/Input';

const Header = () => {
  return (
    <header className='h-16 bg-surface flex justify-end items-center px-6'>
      <div className='flex-1 max-w-xl'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary' />
          <Input
            type='search'
            placeholder='Search movies...'
            leftIcon={<Search className='w-4 h-4' />}
            rightIcon={
              <button className='hover:bg-surface-hover p-1 rounded'>
                <X className='w-4 h-4' />
              </button>
            }
          />
        </div>
      </div>

      <div className='flex items-center gap-4 ml-6'>
        <button className='p-2 hover:bg-surface-hover rounded-lg transition-colors'>
          <User className='w-5 h-5 text-secondary' />
        </button>
      </div>
    </header>
  );
};

export default Header;
