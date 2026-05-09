import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Brain, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <BookOpen className="h-6 w-6" id="logo-icon-book" />
            <Brain className="-ml-2 h-4 w-4 text-blue-400" id="logo-icon-brain" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">StudySmarter</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                Vault
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <User className="h-5 w-5" />
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800 active:scale-95"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
