import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  return (
    <div className='flex h-screen bg-background'>
      <Sidebar />
      <div className='pl-8 flex flex-col flex-1'>
        <Header />
        <main className='flex-1 overflow-auto'>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
