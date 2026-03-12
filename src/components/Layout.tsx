import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';

const Layout = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <main className="py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
