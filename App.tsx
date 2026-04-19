
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, Files, Trash2, Cpu, FileAudio, FileVideo, FileImage, Layers, ArrowRight, Zap } from 'lucide-react';
import { MediaFile, MediaType } from './types';
import { MediaCard } from './components/MediaCard';
import { transcribeMedia, summarizeTranscript } from './services/geminiService';

const App: React.FC = () => {
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList | File[]) => {
    const newMedia: MediaFile[] = Array.from(files).map((file: File) => {
      let type: MediaType = 'image';
      if (file.type.startsWith('audio/')) type = 'audio';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('image/')) type = 'image';

      return {
        id: Math.random().toString(36).substring(2, 11),
        file,
        previewUrl: URL.createObjectURL(file),
        type,
        status: 'idle'
      };
    });

    setMediaList(prev => [...prev, ...newMedia]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processFiles(event.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeMedia = (id: string) => {
    setMediaList(prev => {
      const item = prev.find(m => m.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(m => m.id !== id);
    });
  };

  const clearAll = () => {
    mediaList.forEach(m => URL.revokeObjectURL(m.previewUrl));
    setMediaList([]);
  };

  const handleTranscribe = async (id: string) => {
    const item = mediaList.find(m => m.id === id);
    if (!item || item.status === 'processing' || item.status === 'summarizing') return;

    setMediaList(prev => prev.map(m => m.id === id ? { ...m, status: 'processing', error: undefined } : m));

    try {
      const transcript = await transcribeMedia(item.file, item.type);
      setMediaList(prev => prev.map(m => m.id === id ? { 
        ...m, 
        status: 'completed', 
        transcript 
      } : m));
    } catch (error: any) {
      setMediaList(prev => prev.map(m => m.id === id ? { 
        ...m, 
        status: 'error', 
        error: error.message || 'Processing failed' 
      } : m));
    }
  };

  const handleSummarize = async (id: string) => {
    const item = mediaList.find(m => m.id === id);
    if (!item || !item.transcript || item.status !== 'completed' || item.summary) return;

    setMediaList(prev => prev.map(m => m.id === id ? { ...m, status: 'summarizing', error: undefined } : m));

    try {
      const summary = await summarizeTranscript(item.transcript);
      setMediaList(prev => prev.map(m => m.id === id ? { 
        ...m, 
        status: 'completed', 
        summary 
      } : m));
    } catch (error: any) {
      setMediaList(prev => prev.map(m => m.id === id ? { 
        ...m, 
        status: 'completed', // Keep as completed but show error? Or switch status?
        error: error.message || 'Summarization failed' 
      } : m));
    }
  };

  const transcribeAll = () => {
    const pending = mediaList.filter(m => m.status === 'idle' || m.status === 'error');
    pending.forEach(item => handleTranscribe(item.id));
  };

  return (
    <div 
      className={`min-h-screen flex flex-col bg-[#020617] text-slate-200 transition-all duration-500 overflow-x-hidden selection:bg-indigo-500/30 ${isDragging ? 'bg-slate-900/50 scale-[0.99] rounded-3xl' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Immersive Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse-slow delay-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-purple-600/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Floating Header */}
      <header className="sticky top-0 z-[60] px-4 py-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-slate-900/30 backdrop-blur-2xl border border-white/5 rounded-3xl px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] group/header">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-md opacity-20 group-hover/header:opacity-40 transition-opacity"></div>
              <div className="relative bg-gradient-to-tr from-indigo-600 to-violet-500 p-2.5 rounded-2xl shadow-lg border border-white/10">
                <Layers className="text-white" size={24} />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-500 tracking-tight leading-none">
                OmniTranscript
              </h1>
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1">Neural Engine Pro</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {mediaList.length > 0 && (
              <button 
                onClick={clearAll}
                className="text-slate-400 hover:text-red-400 p-3 rounded-2xl transition-all hover:bg-red-500/10 active:scale-90"
                title="Clear All"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="group relative bg-white text-slate-950 px-6 py-3 rounded-2xl font-black shadow-[0_10px_20px_rgba(255,255,255,0.1)] transition-all hover:shadow-[0_15px_30px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3 overflow-hidden"
            >
              <Upload size={20} className="relative z-10 transition-transform group-hover:scale-110" />
              <span className="relative z-10 text-sm tracking-tight">Upload Media</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              multiple 
              accept="image/*,audio/*,video/*" 
              className="hidden" 
            />
          </div>
        </div>
      </header>

      {/* Main Experience */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-10 relative z-10">
        {mediaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[65vh] animate-in fade-in zoom-in-95 duration-1000">
            <div className="text-center mb-16 space-y-4 max-w-2xl px-4">
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
                 <Zap size={14} fill="currentColor" /> Neural Intelligence v3.0
               </div>
               <h2 className="text-4xl sm:text-7xl font-black text-white tracking-tighter leading-[0.9] sm:leading-[0.8]">
                 Transcribe Everything <span className="text-indigo-500">Instantly.</span>
               </h2>
               <p className="text-slate-500 text-lg sm:text-xl font-medium pt-4 leading-relaxed">
                 The most intuitive multi-modal analysis platform. <br className="hidden sm:block" /> Upload images, audio, or video and watch the AI work.
               </p>
            </div>

            <div 
              className={`relative group cursor-pointer w-full max-w-3xl aspect-[16/8] flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] transition-all duration-700 ${isDragging ? 'border-indigo-400 bg-indigo-500/10 scale-[1.05] shadow-[0_0_80px_rgba(99,102,241,0.2)]' : 'border-white/5 bg-slate-900/20 hover:border-white/10 hover:bg-slate-900/40'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="absolute inset-0 rounded-[3rem] overflow-hidden pointer-events-none">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              </div>

              <div className="relative flex flex-col items-center gap-8 p-12 text-center transition-all duration-500 group-hover:scale-110">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-slate-950 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/5 transform group-hover:-rotate-12 transition-all duration-500 group-hover:shadow-indigo-500/20">
                    <Upload className={`transition-colors duration-500 ${isDragging ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`} size={40} />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-white font-black text-2xl tracking-tight">Click or Drag & Drop</p>
                  <div className="flex gap-4 justify-center items-center">
                    <span className="w-12 h-[1px] bg-slate-800"></span>
                    <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Supported Formats</span>
                    <span className="w-12 h-[1px] bg-slate-800"></span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/80 rounded-2xl border border-white/5 text-xs font-bold text-slate-300 group-hover:border-emerald-500/30 transition-all">
                    <FileImage size={16} className="text-emerald-400" /> Image
                  </div>
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/80 rounded-2xl border border-white/5 text-xs font-bold text-slate-300 group-hover:border-blue-500/30 transition-all">
                    <FileAudio size={16} className="text-blue-400" /> Audio
                  </div>
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/80 rounded-2xl border border-white/5 text-xs font-bold text-slate-300 group-hover:border-purple-500/30 transition-all">
                    <FileVideo size={16} className="text-purple-400" /> Video
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Workspace</span>
                </div>
                <h2 className="text-5xl font-black text-white tracking-tighter">Media Queue</h2>
                <p className="text-slate-500 font-medium text-lg">You have <span className="text-slate-200">{mediaList.length} files</span> prepared for analysis.</p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={transcribeAll}
                  className="group bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-[1.5rem] font-black shadow-[0_20px_40px_rgba(79,70,229,0.2)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                >
                  <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                  <span>Start All Jobs</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-32">
              {mediaList.map((media, idx) => (
                <div key={media.id} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards" style={{ animationDelay: `${idx * 100}ms` }}>
                  <MediaCard 
                    media={media} 
                    onRemove={removeMedia} 
                    onTranscribe={handleTranscribe} 
                    onSummarize={handleSummarize}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Drag overlay hint */}
      {isDragging && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-md border-[16px] border-indigo-500/20 rounded-[4rem]"></div>
          <div className="relative bg-slate-950 px-12 py-8 rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(99,102,241,0.3)] flex flex-col items-center gap-6 animate-bounce-subtle">
            <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)]">
              <Upload className="text-white" size={48} strokeWidth={3} />
            </div>
            <span className="text-4xl font-black text-white tracking-tighter italic">Release to Process</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
