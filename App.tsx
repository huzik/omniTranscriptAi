
import React, { useState, useCallback, useRef } from 'react';
import { Upload, Sparkles, Files, Trash2, Cpu, FileAudio, FileVideo, FileImage } from 'lucide-react';
import { MediaFile, MediaType } from './types';
import { MediaCard } from './components/MediaCard';
import { transcribeMedia } from './services/geminiService';

const App: React.FC = () => {
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newMedia: MediaFile[] = Array.from(files).map((file: File) => {
      let type: MediaType = 'image';
      if (file.type.startsWith('audio/')) type = 'audio';
      if (file.type.startsWith('video/')) type = 'video';
      if (file.type.startsWith('image/')) type = 'image';

      return {
        id: Math.random().toString(36).substring(2, 11),
        file,
        previewUrl: URL.createObjectURL(file),
        type,
        status: 'idle'
      };
    });

    setMediaList(prev => [...prev, ...newMedia]);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    if (!item || item.status === 'processing') return;

    // Set state to processing
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
        error: error.message || 'Unknown error occurred' 
      } : m));
    }
  };

  const transcribeAll = async () => {
    const idleItems = mediaList.filter(m => m.status === 'idle' || m.status === 'error');
    idleItems.forEach(item => handleTranscribe(item.id));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                OmniTranscript AI
              </h1>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Advanced Neural Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {mediaList.length > 0 && (
              <button 
                onClick={clearAll}
                className="text-slate-400 hover:text-red-400 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Upload size={18} />
              <span>Upload Media</span>
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        {mediaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full"></div>
              <div className="relative grid grid-cols-2 gap-4 p-8 bg-slate-800/40 border border-slate-700/50 rounded-3xl backdrop-blur-sm">
                <FileImage className="text-emerald-400" size={48} />
                <FileVideo className="text-purple-400" size={48} />
                <FileAudio className="text-blue-400" size={48} />
                <Cpu className="text-amber-400" size={48} />
              </div>
            </div>
            <div className="max-w-md space-y-4">
              <h2 className="text-3xl font-bold text-white">Multi-Modal Transcription</h2>
              <p className="text-slate-400 leading-relaxed">
                Transform images into searchable text, audio into verbatim transcripts, and videos into context-aware descriptions using state-of-the-art neural processing.
              </p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="group relative px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all active:scale-95"
              >
                Get Started
                <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Files size={16} />
                <span>{mediaList.length} items queued</span>
              </div>
              <button 
                onClick={transcribeAll}
                className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg font-medium border border-slate-700 transition-colors"
              >
                Process All Pending
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
              {mediaList.map(media => (
                <MediaCard 
                  key={media.id} 
                  media={media} 
                  onRemove={removeMedia} 
                  onTranscribe={handleTranscribe} 
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 border-t border-slate-800 text-center text-slate-600 text-xs">
        <p>© 2024 OmniTranscript AI • Powered by High-Performance Neural Models</p>
      </footer>
    </div>
  );
};

export default App;
