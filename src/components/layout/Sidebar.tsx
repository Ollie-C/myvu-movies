import { Film, Trophy, Layers, ListOrdered, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils/cn';

const navigation = [
  { name: 'Collections', href: '/collections', icon: Layers },
  { name: 'Movies', href: '/movies', icon: Film },
  { name: 'Rankings', href: '/rankings', icon: ListOrdered },
  // { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className='fixed left-0 top-0 z-20 h-full w-32 bg-surface shadow-neo-sm'>
      <div className='flex h-full flex-col overflow-y-auto'>
        <div className='flex flex-col gap-2 p-4'>
          <h1 className='text-lg mb-4 text-center'>Myvu</h1>

          {/* Dashboard/Profile Icon */}
          <div className='flex flex-col items-center mb-4'>
            <Link
              to='/'
              className={cn(
                'flex items-center justify-center p-2 hover:bg-surface-hover rounded-lg transition-colors',
                location.pathname === '/' && 'bg-surface-hover'
              )}>
              <User
                className={cn(
                  'w-5 h-5',
                  location.pathname === '/' ? 'text-primary' : 'text-secondary'
                )}
              />
            </Link>
            <span
              className={cn(
                'text-xs mt-1',
                location.pathname === '/' ? 'text-primary' : 'text-secondary'
              )}>
              Dashboard
            </span>
          </div>

          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-secondary hover:bg-surface-hover hover:text-primary',
                location.pathname === item.href &&
                  'bg-surface-hover text-primary'
              )}>
              <item.icon className='size-5' />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
