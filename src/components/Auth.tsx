import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, db, serverTimestamp } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthPageProps {
  mode: 'login' | 'signup' | 'forgot';
}

export const Auth: React.FC<AuthPageProps> = ({ mode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          createdAt: serverTimestamp()
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email,
          displayName: name,
          createdAt: serverTimestamp()
        });
        navigate('/dashboard');
      } else if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setSuccess('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'Email/Password sign-in is not enabled in the Firebase Console. Please use Google Login or enable it.';
      }
      setError(msg || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900">
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Create account'}
              {mode === 'forgot' && 'Reset password'}
            </h1>
            <p className="mt-2 text-slate-500">
              {mode === 'login' && 'Sign in to access your study vault'}
              {mode === 'signup' && 'Start your journey to smarter studying'}
              {mode === 'forgot' && 'We\'ll send instructions to your email'}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 font-medium text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <div className="relative my-8 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
              <div className="absolute inset-x-0 top-1/2 h-px bg-slate-100" />
              <span className="relative bg-white px-4">Or continue with email</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    {mode === 'login' && (
                      <Link to="/forgot" className="text-sm font-medium text-blue-600 hover:underline">
                        Forgot?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-sm font-medium text-red-500">{error}</p>}
              {success && <p className="text-sm font-medium text-green-600">{success}</p>}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot' && 'Send Reset Link'}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center text-sm text-slate-600">
            {mode === 'login' && (
              <>
                Don't have an account?{' '}
                <Link to="/signup" className="font-bold text-slate-900 hover:underline">
                  Sign Up
                </Link>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-slate-900 hover:underline">
                  Log In
                </Link>
              </>
            )}
            {mode === 'forgot' && (
              <Link to="/login" className="font-bold text-slate-900 hover:underline">
                Back to Login
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

