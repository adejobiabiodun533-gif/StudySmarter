import React, { useState } from 'react';
import { StudyMaterial, Topic, Mnemonic, Question } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, serverTimestamp } from '../lib/firebase';
import { geminiService } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Brain, Sparkles, BookOpen, 
  HelpCircle, Loader2, CheckCircle2, XCircle, 
  ChevronRight, RefreshCw, Zap, Lightbulb
} from 'lucide-react';
import { cn } from '../lib/utils';

interface StudyEngineProps {
  material: StudyMaterial;
  onBack: () => void;
}

type Mode = 'prep' | 'practice';

export const StudyEngine: React.FC<StudyEngineProps> = ({ material, onBack }) => {
  const [mode, setMode] = useState<Mode>('prep');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysisStep('Initializing Gemini AI high-speed analysis...');
    
    try {
      setAnalysisStep('Performing comprehensive document scan & study generation...');
      
      const analysis = await geminiService.performFullAnalysis(material.rawContent);

      setAnalysisStep('Securing results in your academic vault...');
      await updateDoc(doc(db, 'materials', material.id), {
        summary: analysis.summary.summary,
        topics: analysis.summary.topics,
        mnemonics: analysis.mnemonics,
        practiceQuestions: analysis.questions,
        updatedAt: serverTimestamp()
      });
      
    } catch (error: any) {
      console.error('Analysis Final Error:', error);
      setAnalysisStep(`Analysis failed: ${error.message || 'Server busy.'}. Retrying...`);
      // Brief pause and then one automatic attempt at sequential if parallel fails
      try {
        const [summary, mnemonics, questions] = await Promise.all([
          geminiService.generateSummary(material.rawContent),
          geminiService.generateMnemonics(material.rawContent),
          geminiService.generateQuestions(material.rawContent)
        ]);
        
        await updateDoc(doc(db, 'materials', material.id), {
          summary: summary.summary,
          topics: summary.topics,
          mnemonics: mnemonics,
          practiceQuestions: questions,
          updatedAt: serverTimestamp()
        });
      } catch (retryErr) {
        setAnalysisStep('Document too complex for rapid analysis. Try a smaller section.');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    if (quizSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const calculateScore = () => {
    if (!material.practiceQuestions) return 0;
    let correct = 0;
    material.practiceQuestions.forEach(q => {
      if (q.type === 'multiple-choice') {
        if (userAnswers[q.id] === q.correctAnswer) correct++;
      } else {
        // Simple string comparison for text answers
        if (userAnswers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) correct++;
      }
    });
    return Math.round((correct / material.practiceQuestions.length) * 100);
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    // Auto-show all feedback for incorrect answers
    const feedback: Record<string, boolean> = {};
    material.practiceQuestions?.forEach(q => {
      feedback[q.id] = true;
    });
    setShowFeedback(feedback);
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setShowFeedback({});
    setQuizSubmitted(false);
  };

  const toggleFeedback = (questionId: string) => {
    setShowFeedback(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const isAnalyzed = !!material.summary;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Vault
      </button>

      <header className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{material.title}</h1>
            {material.category && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 uppercase tracking-wider">
                {material.category}
              </span>
            )}
          </div>
          <p className="mt-2 text-slate-500">
            Last updated {material.updatedAt?.toDate 
              ? material.updatedAt.toDate().toLocaleDateString() 
              : new Date(material.updatedAt).toLocaleDateString()}
          </p>
        </div>

        {!isAnalyzed && !analyzing && (
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3 font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800"
          >
            <Sparkles className="h-5 w-5" />
            Analyze with AI
          </button>
        )}
      </header>

      {analyzing ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="relative h-24 w-24">
            <Loader2 className="absolute inset-0 h-24 w-24 animate-spin text-slate-100" strokeWidth={1} />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Brain className="h-10 w-10 text-slate-900" />
            </motion.div>
          </div>
          <h2 className="mt-8 text-2xl font-bold font-display text-slate-900">Studying your material...</h2>
          <div className="mt-4 flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 border border-slate-100">
            <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
            <p className="text-sm font-medium text-slate-600">{analysisStep}</p>
          </div>
        </div>
      ) : !isAnalyzed ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-slate-50/50 p-12 py-24 text-center">
          <Zap className="h-12 w-12 text-slate-300" />
          <h3 className="mt-6 text-xl font-bold text-slate-900">AI Engine Ready</h3>
          <p className="mt-2 max-w-sm text-slate-500">Enable AI analysis to unlock summaries, memory aids, and practice modes.</p>
          <button
            onClick={handleAnalyze}
            className="mt-8 rounded-full bg-slate-900 px-8 py-3 font-bold text-white"
          >
            Start Analysis
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main Controls */}
          <div className="flex gap-2 rounded-2xl bg-slate-100 p-1.5 shadow-inner">
            <button
              onClick={() => setMode('prep')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
                mode === 'prep' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <BookOpen className="h-4 w-4" />
              Prep Study Mode
            </button>
            <button
              onClick={() => setMode('practice')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
                mode === 'practice' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <HelpCircle className="h-4 w-4" />
              Practice Questions
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'prep' ? (
              <motion.div
                key="prep"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-8"
              >
                {/* Summary Section */}
                <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
                  <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                    <Sparkles className="h-6 w-6 text-blue-500" />
                    Simplified Summary
                  </h2>
                  <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                    {material.summary}
                  </p>
                </section>

                {/* Topics Grid */}
                <section className="grid gap-6 md:grid-cols-2">
                  {material.topics?.map((topic, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900">{topic.title}</h3>
                      <p className="mt-3 text-slate-600 leading-relaxed text-sm">
                        {topic.content}
                      </p>
                    </div>
                  ))}
                </section>

                {/* Mnemonics Section */}
                <section className="rounded-3xl border border-slate-100 bg-slate-900 p-8 shadow-2xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl bg-blue-500 rounded-full h-64 w-64 -mr-32 -mt-32" />
                  <div className="relative z-10">
                    <h2 className="flex items-center gap-2 text-2xl font-bold">
                      <Brain className="h-6 w-6 text-pink-400" />
                      Memory Hacks
                    </h2>
                    <p className="mt-2 text-slate-400">Unlock your memory vault with AI-suggested mnemonics.</p>
                    
                    <div className="mt-8 grid gap-4">
                      {material.mnemonics?.map((m, idx) => (
                        <motion.div 
                          key={idx} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:bg-white/10"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400/60">Concept: {m.concept}</span>
                          <h4 className="mt-2 text-2xl font-bold text-white tracking-tight leading-none group-hover:text-blue-300 transition-colors">
                            "{m.mnemonic}"
                          </h4>
                          <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-xl">
                            {m.explanation}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </section>
              </motion.div>
            ) : (
              <motion.div
                key="practice"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6 pb-20"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                   <div>
                    <h2 className="text-3xl font-bold text-slate-900 font-display">Practice Lab</h2>
                    <p className="text-slate-500 mt-1">Simulate exam conditions with weighted practice questions.</p>
                   </div>
                   {quizSubmitted && (
                     <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="rounded-2xl bg-slate-900 px-6 py-4 text-white shadow-xl flex items-center gap-4"
                     >
                        <div className="h-12 w-12 rounded-full border-2 border-white/20 flex items-center justify-center font-bold text-xl">
                          {calculateScore()}%
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Your Score</p>
                          <p className="text-lg font-bold">Excellent Work!</p>
                        </div>
                        <button 
                          onClick={handleResetQuiz}
                          className="ml-4 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
                        >
                          <RefreshCw className="h-5 w-5" />
                        </button>
                     </motion.div>
                   )}
                </div>

                <div className="grid gap-6">
                {material.practiceQuestions?.map((q, idx) => (
                  <div key={q.id} className={cn(
                    "rounded-2xl border bg-white p-8 transition-all group",
                    quizSubmitted && userAnswers[q.id] === q.correctAnswer ? "border-green-100 bg-green-50/20" : 
                    quizSubmitted && userAnswers[q.id] !== q.correctAnswer ? "border-red-100 bg-red-50/20" :
                    "border-slate-100 shadow-sm"
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] border border-slate-100">
                          {q.type.replace('-', ' ')}
                        </span>
                        <h3 className="mt-4 text-xl font-bold text-slate-900 leading-tight">
                          {idx + 1}. {q.question}
                        </h3>
                      </div>
                      {quizSubmitted && (
                        userAnswers[q.id] === q.correctAnswer 
                          ? <CheckCircle2 className="h-6 w-6 text-green-500" />
                          : <XCircle className="h-6 w-6 text-red-500" />
                      )}
                    </div>

                    <div className="mt-8 space-y-3">
                      {q.type === 'multiple-choice' ? (
                        <div className="grid gap-2">
                          {q.options?.map((option, oIdx) => (
                            <button
                              key={oIdx}
                              disabled={quizSubmitted}
                              onClick={() => handleAnswerChange(q.id, option)}
                              className={cn(
                                "flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all",
                                userAnswers[q.id] === option 
                                  ? quizSubmitted && option === q.correctAnswer ? "border-green-500 bg-green-50/50 ring-1 ring-green-500" :
                                    quizSubmitted ? "border-red-500 bg-red-50/50 ring-1 ring-red-500" :
                                    "border-slate-900 bg-slate-50 ring-1 ring-slate-900" 
                                  : option === q.correctAnswer && quizSubmitted ? "border-green-500 bg-green-50/50" :
                                    "border-slate-100 hover:border-slate-200"
                              )}
                            >
                              <span className="font-medium text-slate-700">{oIdx + 1}. {option}</span>
                              {userAnswers[q.id] === option && (
                                quizSubmitted && option === q.correctAnswer 
                                  ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  : quizSubmitted ? <XCircle className="h-5 w-5 text-red-600" /> :
                                  <div className="h-5 w-5 rounded-full bg-slate-900 flex items-center justify-center">
                                    <div className="h-2 w-2 rounded-full bg-white" />
                                  </div>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          disabled={quizSubmitted}
                          placeholder="Type your academic response..."
                          value={userAnswers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className={cn(
                            "w-full rounded-2xl border bg-slate-50 p-6 outline-none transition-all placeholder:text-slate-400 italic",
                            quizSubmitted && userAnswers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim() ? "border-green-200 bg-green-50/50" :
                            quizSubmitted ? "border-red-200 bg-red-50/50" :
                            "focus:border-slate-400 focus:bg-white"
                          )}
                          rows={4}
                        />
                      )}
                    </div>

                    {!quizSubmitted && (
                      <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-6">
                        <button
                          onClick={() => toggleFeedback(q.id)}
                          className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                          <HelpCircle className="h-4 w-4" />
                          {showFeedback[q.id] ? 'Hide Answer' : 'Peek Answer'}
                        </button>
                      </div>
                    )}

                    <AnimatePresence>
                      {showFeedback[q.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-6 overflow-hidden rounded-2xl bg-white border border-slate-100 p-8 shadow-sm"
                        >
                          <div className="flex items-center gap-3 font-bold text-slate-900 mb-4">
                             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                               <CheckCircle2 className="h-6 w-6 text-green-600" />
                             </div>
                             <div>
                               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">Correct Answer</p>
                               <p className="mt-1">{q.correctAnswer}</p>
                             </div>
                          </div>
                          
                          <div className="rounded-xl bg-slate-50 p-6 border border-slate-100">
                            <h5 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                              <Lightbulb className="h-4 w-4 text-yellow-500" />
                              Key Concept & Explanation
                            </h5>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                              {q.explanation}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                </div>

                {!quizSubmitted && material.practiceQuestions && material.practiceQuestions.length > 0 && (
                  <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
                    <button
                      onClick={handleSubmitQuiz}
                      className="group flex items-center gap-3 rounded-full bg-slate-900 px-12 py-4 font-bold text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-400 group-hover:scale-125 transition-transform" />
                      Complete Final Exam
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
