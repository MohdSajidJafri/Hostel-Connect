import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSearch, FaEnvelope, FaHome, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-primary-600 text-white p-2 rounded-xl group-hover:scale-105 transition-transform">
                <FaHome size={18} />
              </div>
              <span className="text-slate-900 font-bold text-xl tracking-tight">Hostel<span className="text-primary-600">Connect</span></span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link to="/" className="text-slate-600 hover:text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg flex items-center transition-colors font-medium text-sm">
              <FaHome className="mr-2" />
              Home
            </Link>
            <Link to="/search" className="text-slate-600 hover:text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg flex items-center transition-colors font-medium text-sm">
              <FaSearch className="mr-2" />
              Search
            </Link>
            <Link to="/messages" className="text-slate-600 hover:text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg flex items-center transition-colors font-medium text-sm">
              <FaEnvelope className="mr-2" />
              Messages
            </Link>
            <div className="relative ml-4 pl-4 border-l border-slate-200">
              <div className="flex items-center gap-3">
                <Link to="/profile" className="text-slate-700 hover:text-primary-600 flex items-center gap-2 transition-colors font-medium text-sm group">
                  <div className="bg-slate-100 p-1.5 rounded-full group-hover:bg-primary-100 transition-colors">
                    <FaUser className="text-slate-500 group-hover:text-primary-600" />
                  </div>
                  {profile?.full_name || 'Profile'}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="ml-2 text-sm text-white bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow active:scale-95 font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-slate-600 hover:text-primary-600 hover:bg-primary-50 p-2 rounded-lg transition-colors focus:outline-none"
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg absolute w-full">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link
              to="/"
              className="text-slate-600 hover:text-primary-600 hover:bg-primary-50 block px-4 py-3 rounded-xl font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <FaHome className="mr-3 text-lg" />
                Home
              </div>
            </Link>
            <Link
              to="/search"
              className="text-slate-600 hover:text-primary-600 hover:bg-primary-50 block px-4 py-3 rounded-xl font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <FaSearch className="mr-3 text-lg" />
                Search
              </div>
            </Link>
            <Link
              to="/messages"
              className="text-slate-600 hover:text-primary-600 hover:bg-primary-50 block px-4 py-3 rounded-xl font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <FaEnvelope className="mr-3 text-lg" />
                Messages
              </div>
            </Link>
            <Link
              to="/profile"
              className="text-slate-600 hover:text-primary-600 hover:bg-primary-50 block px-4 py-3 rounded-xl font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <FaUser className="mr-3 text-lg" />
                Profile
              </div>
            </Link>
            <div className="pt-2 mt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}
                className="text-white bg-slate-800 hover:bg-slate-900 block w-full text-center px-4 py-3 rounded-xl font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
