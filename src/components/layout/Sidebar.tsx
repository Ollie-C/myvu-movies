import { Film, Trophy, Layers, ListOrdered } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

const navigation = [
  { name: 'Collections', href: '/collections', icon: Layers },
  { name: 'Movies', href: '/movies', icon: Film },
  { name: 'Rankings', href: '/rankings', icon: ListOrdered },
  // { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <motion.aside
      className='fixed left-0 top-0 z-20 h-full bg-surface shadow-neo-sm group'
      initial={{ width: '50px' }}
      whileHover={{ width: '100px' }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}>
      <div className='flex h-full flex-col overflow-y-auto'>
        <div className='flex flex-col gap-2 px-0 py-6'>
          {/* Logo/Title */}
          <motion.div className='flex items-center justify-center mb-10 overflow-hidden'>
            <h1 className='text-[9px] whitespace-nowrap'>MYVU</h1>
          </motion.div>

          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center justify-center gap-3 p-2 hover:bg-surface-hover rounded-lg transition-colors',
                location.pathname === item.href &&
                  'bg-surface-hover text-primary'
              )}>
              <item.icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  location.pathname === item.href
                    ? 'text-primary'
                    : 'text-secondary'
                )}
              />
            </Link>
          ))}
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
