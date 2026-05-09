import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, Brain, Sparkles, Zap, Shield, FileText } from 'lucide-react';

const features = [
  {
    icon: <FileText className="h-6 w-6 text-blue-500" />,
    title: "Smart Vault",
    description: "Securely store your lecture notes, PDFs, and textbooks in your personalized academic cloud."
  },
  {
    icon: <Sparkles className="h-6 w-6 text-purple-500" />,
    title: "AI Summarizer",
    description: "Transform complex documents into concise, simplified summaries with the power of Gemini AI."
  },
  {
    icon: <Brain className="h-6 w-6 text-pink-500" />,
    title: "Memory Aids",
    description: "Generate catchy mnemonics and memory cheats to remember difficult formulas and concepts forever."
  },
  {
    icon: <Zap className="h-6 w-6 text-yellow-500" />,
    title: "Prep Study Mode",
    description: "Quick revision sheets with key points and flashcard-style aids generated instantly from your notes."
  }
];

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-24 pt-20 pb-12">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl">
            Study <span className="text-slate-500">Smarter,</span> Not Harder.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl">
            Transform heavy textbooks and complex lecture notes into simplified summaries, memory aids, and practice questions using AI.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/signup"
              className="w-full rounded-full bg-slate-900 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 hover:shadow-slate-300 sm:w-auto"
            >
              Start Studying Free
            </Link>
            <Link
              to="/login"
              className="w-full rounded-full border border-slate-200 bg-white px-8 py-4 text-lg font-semibold text-slate-900 transition-all hover:bg-slate-50 sm:w-auto"
            >
              Log In to Vault
            </Link>
          </div>
        </motion.div>

        {/* Hero Illustration Placeholder/Style */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mt-20 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-2xl"
        >
          <div className="aspect-video w-full bg-gradient-to-br from-slate-50 to-white p-8 flex items-center justify-center text-slate-400">
            <div className="flex flex-col items-center gap-4">
               <div className="flex -space-x-4">
                  <div className="h-32 w-24 rounded-lg bg-white shadow-lg border border-slate-100 p-4 flex flex-col gap-2">
                    <div className="h-2 w-full bg-slate-100 rounded" />
                    <div className="h-2 w-3/4 bg-slate-100 rounded" />
                    <div className="h-2 w-1/2 bg-slate-100 rounded" />
                  </div>
                  <div className="h-40 w-32 rounded-lg bg-white shadow-2xl border border-slate-100 p-6 flex flex-col gap-3 relative z-10 translate-y-[-10px]">
                    <div className="h-4 w-4 rounded-full bg-blue-500 mb-2" />
                    <div className="h-3 w-full bg-slate-100 rounded" />
                    <div className="h-3 w-full bg-slate-100 rounded" />
                    <div className="h-3 w-4/5 bg-slate-100 rounded" />
                    <div className="h-3 w-full bg-slate-100 rounded" />
                  </div>
                  <div className="h-32 w-24 rounded-lg bg-white shadow-lg border border-slate-100 p-4 flex flex-col gap-2">
                    <div className="h-2 w-full bg-slate-100 rounded" />
                    <div className="h-2 w-3/4 bg-slate-100 rounded" />
                    <div className="h-2 w-1/2 bg-slate-100 rounded" />
                  </div>
               </div>
               <span className="text-sm font-medium tracking-widest uppercase opacity-40">Interactive Study Engine</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Everything you need to excel.</h2>
          <p className="mt-4 text-slate-600">Built for the modern student who values time and clarity.</p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="group rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-md"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-slate-100">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Trust/CTA */}
      <section className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 px-8 py-16 text-white shadow-2xl">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to study smarter?</h2>
          <p className="mt-4 text-slate-400">Join thousands of students who have simplified their learning process.</p>
          <Link
            to="/signup"
            className="mt-10 inline-block rounded-full bg-white px-10 py-4 text-lg font-bold text-slate-900 transition-transform active:scale-95"
          >
            Create My Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};
