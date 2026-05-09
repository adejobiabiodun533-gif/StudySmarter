import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, serverTimestamp } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { StudyMaterial } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Plus, Search, Trash2, BookOpen, Brain, 
  ChevronRight, Loader2, X, Upload, MoreVertical,
  FileUp, AlertCircle, Inbox, Clock, Calendar,
  BarChart3, Zap
} from 'lucide-react';
import { StudyEngine } from './StudyEngine';
import { cn } from '../lib/utils';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState<StudyMaterial | null>(null);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = async (arrayBuffer: ArrayBuffer) => {
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      text += strings.join(' ') + '\n';
    }
    return text;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    if ('files' in e.target && e.target.files?.[0]) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files?.[0]) {
      e.preventDefault();
      file = e.dataTransfer.files[0];
    }

    if (!file) return;

    setParsing(true);
    setNewTitle(file.name.split('.').slice(0, -1).join('.') || file.name);

    try {
      if (file.type === 'application/pdf') {
        const buffer = await file.arrayBuffer();
        const text = await extractTextFromPdf(buffer);
        setNewContent(text);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        setNewContent(result.value);
      } else {
        const text = await file.text();
        setNewContent(text);
      }
    } catch (err) {
      console.error('File parsing error:', err);
      alert('Failed to parse file. Please try pasting the content manually.');
    } finally {
      setParsing(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'materials'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudyMaterial[];
      
      setMaterials(data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime() || 0;
        const timeB = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
      }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'materials');
    });

    return unsubscribe;
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle || !newContent) return;

    setAddingMaterial(true);
    try {
      const newDoc = {
        userId: user.uid,
        title: newTitle,
        category: newCategory,
        rawContent: newContent,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'materials'), newDoc);
      
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewCategory('');
      
      // Auto-open the study engine for the new material
      setActiveMaterial({
        id: docRef.id,
        ...newDoc
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'materials');
    } finally {
      setAddingMaterial(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this study material?')) return;
    try {
      await deleteDoc(doc(db, 'materials', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `materials/${id}`);
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (activeMaterial) {
    return <StudyEngine material={activeMaterial} onBack={() => setActiveMaterial(null)} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Study Vault</h1>
          <p className="mt-1 text-slate-500">Access and organize your learning resources.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition-all hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-200"
        >
          <Plus className="h-5 w-5" />
          <span>New Document</span>
        </button>
      </header>

      {/* Search and Filters */}
      <div className="mb-8 flex items-center rounded-2xl border border-slate-100 bg-white px-4 shadow-sm focus-within:border-slate-200">
        <Search className="h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search materials by title or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent px-3 py-4 text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-slate-200" />
          <p className="mt-4 text-slate-400 font-medium tracking-tight font-display uppercase tracking-widest text-xs">Accessing your vault...</p>
        </div>
      ) : filteredMaterials.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredMaterials.map((material) => (
              <motion.div
                key={material.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setActiveMaterial(material)}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-1"
              >
                <div className="mb-8 flex items-start justify-between">
                  <div className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-all group-hover:scale-110",
                    material.summary ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-300"
                  )}>
                    {material.summary ? <Zap className="h-7 w-7" /> : <FileText className="h-7 w-7" />}
                  </div>
                  <button
                    onClick={(e) => handleDelete(material.id, e)}
                    className="rounded-full p-2 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-slate-900 line-clamp-2">
                    {material.title}
                  </h3>
                  {material.category && (
                    <span className="mt-2 inline-block rounded-full bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100">
                      {material.category}
                    </span>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {material.createdAt?.toDate 
                        ? material.createdAt.toDate().toLocaleDateString() 
                        : new Date(material.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {material.summary ? (
                    <div className="flex items-center gap-1 text-slate-900 font-bold text-[11px] uppercase tracking-wider">
                      <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
                      Academic Ready
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                      <Clock className="h-3.5 w-3.5" />
                      Pending Analysis
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="relative mb-8">
            <div className="absolute inset-0 scale-150 blur-3xl opacity-20 bg-slate-400 rounded-full" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-xl">
              <Inbox className="h-10 w-10 text-slate-300" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 font-display">Your Academic Vault is Empty</h3>
          <p className="mt-2 max-w-sm text-slate-500 leading-relaxed">
            Start your journey by uploading your first lecture notes, PDFs, or research papers for AI analysis.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-8 flex items-center gap-2 rounded-full bg-slate-900 px-8 py-4 font-bold text-white shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Initialize My First Material
          </button>
        </motion.div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-bold text-slate-900">Add Study Material</h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-50"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">

              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileChange}
                className="mb-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center transition-colors hover:border-slate-300"
              >
                {parsing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-slate-900" />
                    <p className="text-sm font-medium text-slate-600">Extracting content from your file...</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-full bg-white p-4 shadow-sm">
                      <FileUp className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900">Upload document</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Drag and drop your PDF, DOCX, or TXT file here, or click to browse.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-6 rounded-full bg-white px-6 py-2 text-sm font-bold text-slate-900 border border-slate-200 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                    >
                      Browse Files
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                    />
                  </>
                )}
              </div>

                  <form id="add-material-form" onSubmit={handleCreate} className="space-y-6">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Document Title</label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Introduction to organic chemistry"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Category / Course (Optional)</label>
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="e.g. Chemistry 101"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Content (Paste lecture notes or text)</label>
                      <textarea
                        required
                        rows={10}
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Paste your study content here..."
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </form>
                </div>

                <div className="p-8 border-t border-slate-50 bg-slate-50/50 rounded-b-3xl shrink-0">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white py-4 font-bold text-slate-900 hover:bg-slate-50 transition-all font-display"
                    >
                      Cancel
                    </button>
                    <button
                      form="add-material-form"
                      type="submit"
                      disabled={addingMaterial || !newContent}
                      className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50 shadow-xl shadow-slate-200 font-display"
                    >
                      {addingMaterial ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-5 w-5" />
                          <span>Save & Analyze</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>

          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
