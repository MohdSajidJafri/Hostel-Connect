import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';

// Route-level code splitting for fast initial load
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Search = lazy(() => import('./pages/Search'));
const Messages = lazy(() => import('./pages/Messages'));
const Conversation = lazy(() => import('./pages/Conversation'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/search" element={<Search />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:userId" element={<Conversation />} />
            </Route>
          </Route>

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
