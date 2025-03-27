import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSearch, FaEnvelope, FaHome, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
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
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-primary-600 font-bold text-xl">Hostel Connect</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md flex items-center">
              <FaHome className="mr-1" />
              Home
            </Link>
            <Link to="/search" className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md flex items-center">
              <FaSearch className="mr-1" />
              Search
            </Link>
            <Link to="/messages" className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md flex items-center">
              <FaEnvelope className="mr-1" />
              Messages
            </Link>
            <div className="relative ml-3">
              <div className="flex items-center">
                <Link to="/profile" className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md flex items-center">
                  <FaUser className="mr-1" />
                  {profile?.full_name || 'Profile'}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="ml-2 text-sm text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md"
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
              className="text-gray-600 hover:text-primary-600 focus:outline-none"
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="text-gray-600 hover:text-primary-600 block px-3 py-2 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <FaHome className="mr-2" />
                Home
              </div>
            </Link>
            <Link
              to="/search"
              className="text-gray-600 hover:text-primary-600 block px-3 py-2 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <FaSearch className="mr-2" />
                Search
              </div>
            </Link>
            <Link
              to="/messages"
              className="text-gray-600 hover:text-primary-600 block px-3 py-2 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <FaEnvelope className="mr-2" />
                Messages
              </div>
            </Link>
            <Link
              to="/profile"
              className="text-gray-600 hover:text-primary-600 block px-3 py-2 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <FaUser className="mr-2" />
                Profile
              </div>
            </Link>
            <button
              onClick={() => {
                handleSignOut();
                setIsMenuOpen(false);
              }}
              className="text-gray-600 hover:text-primary-600 block w-full text-left px-3 py-2 rounded-md"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
