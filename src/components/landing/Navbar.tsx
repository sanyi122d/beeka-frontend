import React, { useState, useEffect } from 'react';
import { Menu, X, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-[#0a0814]/90 backdrop-blur-sm py-3 shadow-lg' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-500 mr-2" />
            <span className="text-white font-bold text-xl">Study Buddy</span>
          </Link>

          <div className="hidden md:flex md:items-center md:space-x-6">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </a>
            <div className="flex items-center space-x-4 ml-6">
              <button 
                onClick={() => navigate('/signin')}
                className="text-white font-medium"
              >
                Sign in
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-full transition-all"
              >
                Sign up
              </button>
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <button
              className="text-gray-300 hover:text-white focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-[#0a0814]/95 backdrop-blur-sm">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a
              href="#features"
              className="block px-3 py-2 text-gray-300 hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#pricing"
              className="block px-3 py-2 text-gray-300 hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </a>
            <div className="flex flex-col space-y-2 pt-4 pb-3 border-t border-gray-700">
              <button 
                onClick={() => {
                  navigate('/signin');
                  setIsMenuOpen(false);
                }}
                className="block px-3 py-2 text-gray-300 hover:text-white text-left"
              >
                Sign in
              </button>
              <button 
                onClick={() => {
                  navigate('/signup');
                  setIsMenuOpen(false);
                }}
                className="mx-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-full transition-all"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;