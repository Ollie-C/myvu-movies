import { Film, Trophy, Layers, Settings, ListOrdered } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils/cn';

const navigation = [
  { name: 'Collections', href: '/collections', icon: Layers },
  { name: 'Movies', href: '/movies', icon: Film },
  { name: 'Rankings', href: '/rankings', icon: ListOrdered },
  // { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className='fixed left-0 top-0 z-20 h-full w-20 bg-surface shadow-neo-sm'>
      <div className='flex h-full flex-col overflow-y-auto'>
        <div className='flex flex-col gap-2 p-4'>
          <h1 className='text-lg mb-8'>Myvu</h1>
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-secondary hover:bg-surface-hover hover:text-primary',
                location.pathname === item.href &&
                  'bg-surface-hover text-primary'
              )}>
              <item.icon className='size-5' />
              {/* <span>{item.name}</span> */}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
