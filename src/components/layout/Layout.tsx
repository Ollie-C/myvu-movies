import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className='flex h-screen bg-background'>
      <Sidebar />
      <div className='pl-32 flex flex-col flex-1'>
        <Header />
        <main className='flex-1 overflow-auto'>
          <div className='px-6 py-4'>{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
