
import React, { useState } from 'react';
import { MediaFile } from '../types';
import { Music, Video, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Copy, Trash2, Zap, Sparkles } from 'lucide-react';

interface MediaCardProps {
  media: MediaFile;
  onRemove: (id: string) => void;
  onTranscribe: (id: string) => void;
  onSummarize: (id: string) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ media, onRemove, onTranscribe, onSummarize }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('transcript');

  const copyToClipboard = (text?: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const getIcon = () => {
    switch (media.type) {
      case 'audio': return <Music className="text-blue-400" size={20} />;
      case 'video': return <Video className="text-purple-400" size={20} />;
      case 'image': return <ImageIcon className="text-emerald-400" size={20} />;
    }
  };

  return (
    <div className={`group/card relative flex flex-col bg-slate-900/30 border border-white/5 rounded-[2.5rem] backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] hover:-translate-y-2 ${media.status === 'processing' || media.status === 'summarizing' ? 'ring-2 ring-indigo-500/50' : ''}`}>
      
      {/* Card Header Overlay */}
      <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
         <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
           <span className="text-[10px] font-black text-white uppercase tracking-widest">{media.type}</span>
         </div>
         <button 
          onClick={(e) => { e.stopPropagation(); onRemove(media.id); }}
          className="p-2.5 bg-red-500/10 hover:bg-red-500 backdrop-blur-md text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all duration-300 active:scale-90"
          title="Remove file"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Media Content */}
      <div className="relative aspect-[4/3] bg-[#050810] rounded-t-[2.5rem] overflow-hidden">
        {media.type === 'image' && (
          <img src={media.previewUrl} alt="Preview" className="w-full h-full object-cover transition-all duration-700 group-hover/card:scale-110" />
        )}
        {media.type === 'video' && (
          <video src={media.previewUrl} className="w-full h-full object-cover" controls />
        )}
        {media.type === 'audio' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-indigo-950/20 to-slate-950">
             <div className="relative">
               <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse"></div>
               <div className="relative w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center border border-white/5 shadow-2xl">
                  <Music size={40} className="text-blue-400" />
               </div>
             </div>
             <audio src={media.previewUrl} controls className="mt-8 w-full scale-90 opacity-70 hover:opacity-100 transition-opacity" />
          </div>
        )}

        {media.status === 'idle' && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover/card:opacity-100 transition-all duration-500 flex items-center justify-center">
            <button 
              onClick={() => onTranscribe(media.id)}
              className="group/btn px-8 py-3 bg-white text-slate-950 rounded-2xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden"
            >
              <Zap size={18} fill="currentColor" className="group-hover/btn:animate-bounce" />
              <span>Process Now</span>
            </button>
          </div>
        )}
      </div>

      {/* Info & Transcript Area */}
      <div className="flex-1 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 bg-slate-800/50 rounded-2xl border border-white/5 shadow-inner shrink-0">
            {getIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black text-white truncate leading-none mb-1">{media.file.name}</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{(media.file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>

        <div className="h-[1px] w-full bg-white/5"></div>

        {(media.status === 'processing' || media.status === 'summarizing') && (
          <div className="flex flex-col items-center justify-center flex-1 py-4 gap-6 animate-in fade-in duration-500">
             <div className="relative">
               <div className="absolute inset-0 bg-indigo-500/20 blur-xl animate-pulse"></div>
               <Loader2 className="animate-spin text-indigo-400" size={48} strokeWidth={2.5} />
             </div>
             <div className="text-center">
               <p className="text-sm font-black text-white uppercase tracking-tighter">
                 {media.status === 'processing' ? 'Analyzing Modalities' : 'Synthesizing Summary'}
               </p>
               <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest animate-pulse">Quantum engine is active</p>
             </div>
          </div>
        )}

        {(media.status === 'completed') && media.transcript && (
          <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-lg shrink-0">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Done</span>
                 </div>
                 {media.summary && (
                   <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5 shrink-0">
                     <button 
                        onClick={() => setActiveTab('transcript')}
                        className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all duration-300 ${activeTab === 'transcript' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       Full
                     </button>
                     <button 
                        onClick={() => setActiveTab('summary')}
                        className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all duration-300 ${activeTab === 'summary' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       Summary
                     </button>
                   </div>
                 )}
               </div>

               <div className="flex items-center gap-2">
                  {!media.summary && (
                    <button 
                      onClick={() => onSummarize(media.id)}
                      className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl transition-all border border-indigo-500/20 group/sum"
                      title="Summarize transcript"
                    >
                      <Sparkles size={16} className="group-hover/sum:rotate-12 transition-transform" />
                    </button>
                  )}
                  <button 
                    onClick={() => copyToClipboard(activeTab === 'transcript' ? media.transcript : media.summary)}
                    className={`p-2 rounded-xl transition-all duration-300 ${isCopied ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                    title="Copy text"
                  >
                    <Copy size={16} />
                  </button>
               </div>
            </div>
            
            <div className="relative group/text rounded-2xl border border-white/5 transition-all group-hover/text:border-white/10 overflow-hidden min-h-[160px]">
              {/* Transcript Layer */}
              <div 
                className={`bg-slate-950/60 p-5 text-sm leading-relaxed font-medium italic max-h-[300px] overflow-y-auto whitespace-pre-wrap custom-scrollbar transition-all duration-500 ease-in-out ${activeTab === 'transcript' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none absolute inset-0 text-slate-400'}`}
              >
                {media.transcript}
              </div>

              {/* Summary Layer */}
              {media.summary && (
                <div 
                  className={`bg-slate-950/60 p-5 text-sm leading-relaxed font-medium italic max-h-[300px] overflow-y-auto whitespace-pre-wrap custom-scrollbar transition-all duration-500 ease-in-out ${activeTab === 'summary' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none absolute inset-0 text-indigo-200'}`}
                >
                  <div className="flex items-center gap-2 mb-3 text-indigo-400">
                    <Sparkles size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">AI Insights</span>
                  </div>
                  {media.summary}
                </div>
              )}
            </div>
          </div>
        )}

        {media.status === 'idle' && (
          <div className="flex flex-col items-center justify-center flex-1 py-8 text-slate-700 gap-4 group-hover/card:text-slate-500 transition-colors">
            <Zap size={32} strokeWidth={1.5} className="group-hover/card:scale-110 transition-transform duration-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Pending Input</p>
          </div>
        )}

        {media.status === 'error' && (
          <div className="flex flex-col items-center justify-center flex-1 py-4 gap-4 animate-in fade-in text-red-400">
             <AlertCircle size={32} />
             <div className="text-center">
               <p className="text-xs font-black uppercase">Failure Detected</p>
               <p className="text-[10px] opacity-60 mt-1 max-w-[200px] line-clamp-2">{media.error}</p>
             </div>
             <button onClick={() => onTranscribe(media.id)} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 transition-all">
               Re-run Job
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
