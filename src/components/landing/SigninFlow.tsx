import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  isSignInWithEmailLink,
  signInWithEmailLink
} from "firebase/auth";
import { auth } from "../../config/firebase";

const SigninFlow: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const { signInWithMagicLink, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Check if this is an email link sign-in
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem("emailForSignIn");
      if (!email) {
        // If email not in localStorage, prompt the user
        email = window.prompt("Please provide your email for confirmation");
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem("emailForSignIn");
            // User is signed in, navigation will be handled by your existing useEffect
          })
          .catch((error) => {
            // Handle error (show message, etc.)
            setMessage("Error signing in: " + error.message);
            setIsError(true);
          });
      }
    }
  }, []);

  const handleMagicLinkSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setEmailLoading(true);
    const error = await signInWithMagicLink(email);
    setEmailLoading(false);
    if (error) {
      setIsError(true);
      setMessage('Error sending confirmation link: ' + error.message);
    } else {
      setIsError(false);
      setMessage('Check your email for confirmation link!');
    }
  };

  const handleGoogleSignin = async () => {
    const error = await signInWithGoogle();
    if (error) {
      toast.error('Google sign-in failed: ' + error.message);
    }
    // Navigation handled by useEffect
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0814] to-[#1a1625] p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Beeka AI</h2>
          <p className="text-gray-400">Welcome Back!</p>
        </div>

        <button
          onClick={handleGoogleSignin}
          className="w-full bg-white text-gray-800 font-medium py-3 px-4 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-5 h-5 mr-2"
          />
          Continue with Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#1a1625] text-gray-400">or</span>
          </div>
        </div>

        <form onSubmit={handleMagicLinkSignin} className="space-y-6">
          {message && (
            <div
              className={`rounded-lg px-4 py-3 text-center font-medium mb-2 transition-all duration-300 ${isError ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`}
            >
              {message}
            </div>
          )}
          <div>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#1a1625] rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            disabled={emailLoading}
          >
            {emailLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Sending...
              </>
            ) : (
              'Sign In'
            )}
            
          </button>
        </form>

        <p className="text-center text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-500 hover:text-blue-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SigninFlow;