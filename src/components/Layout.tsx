import { Outlet } from 'react-router-dom';
import AppShell from './AppShell';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './LoadingScreen';

const Layout = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
};

export default Layout;
