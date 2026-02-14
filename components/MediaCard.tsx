
import React, { useState } from 'react';
import { MediaFile } from '../types';
import { FileText, Music, Video, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Copy, X, Maximize2 } from 'lucide-react';

interface MediaCardProps {
  media: MediaFile;
  onRemove: (id: string) => void;
  onTranscribe: (id: string) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ media, onRemove, onTranscribe }) => {
  const [isFullView, setIsFullView] = useState(false);

  const copyToClipboard = () => {
    if (media.transcript) {
      navigator.clipboard.writeText(media.transcript);
      alert("Transcript copied to clipboard!");
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
    <>
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden transition-all hover:border-slate-600 flex flex-col h-full shadow-lg group/card">
        <div className="p-4 flex items-center justify-between border-b border-slate-700 bg-slate-800/30">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-slate-900 rounded-lg shrink-0">
              {getIcon()}
            </div>
            <div className="truncate">
              <h3 className="text-sm font-medium text-slate-200 truncate">{media.file.name}</h3>
              <p className="text-xs text-slate-400 uppercase tracking-wider">{(media.file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button 
            onClick={() => onRemove(media.id)}
            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative aspect-video bg-black flex items-center justify-center">
          {media.type === 'image' && (
            <img src={media.previewUrl} alt="Preview" className="w-full h-full object-contain" />
          )}
          {media.type === 'video' && (
            <video src={media.previewUrl} className="w-full h-full object-contain" controls />
          )}
          {media.type === 'audio' && (
            <div className="flex flex-col items-center gap-2">
              <Music size={48} className="text-slate-700" />
              <audio src={media.previewUrl} controls className="w-full max-w-[200px]" />
            </div>
          )}
          
          {media.status === 'idle' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
              <button 
                onClick={() => onTranscribe(media.id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-xl transition-transform active:scale-95"
              >
                Generate Transcript
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 p-4 flex flex-col gap-3 min-h-[150px]">
          {media.status === 'processing' && (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-3">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <p className="text-sm animate-pulse">AI is analyzing media...</p>
            </div>
          )}

          {media.status === 'error' && (
            <div className="flex flex-col items-center justify-center flex-1 text-red-400 gap-2 p-4 text-center">
              <AlertCircle size={32} />
              <p className="text-xs font-medium">Processing Error</p>
              <p className="text-[10px] opacity-70">{media.error}</p>
              <button 
                onClick={() => onTranscribe(media.id)}
                className="mt-2 text-xs underline hover:text-white"
              >
                Try Again
              </button>
            </div>
          )}

          {media.status === 'completed' && media.transcript && (
            <div className="flex flex-col flex-1 gap-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 size={14} /> AI Transcript Ready
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsFullView(true)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-all"
                    title="Read full transcript"
                  >
                    <Maximize2 size={14} />
                  </button>
                  <button 
                    onClick={copyToClipboard}
                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-all"
                    title="Copy to clipboard"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className="relative group/transcript">
                <div className="bg-slate-900/80 rounded-lg p-3 text-sm text-slate-300 max-h-[160px] overflow-y-auto leading-relaxed border border-slate-700/50 whitespace-pre-wrap italic custom-scrollbar transition-colors group-hover/transcript:border-slate-600/50">
                  {media.transcript}
                </div>
                {media.transcript.length > 200 && (
                   <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none rounded-b-lg group-hover/transcript:opacity-0 transition-opacity" />
                )}
              </div>
            </div>
          )}

          {media.status === 'idle' && (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-500 gap-2">
              <FileText size={32} />
              <p className="text-xs">Ready for transcription</p>
            </div>
          )}
        </div>
      </div>

      {/* Full View Modal */}
      {isFullView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsFullView(false)} />
          <div className="relative bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg">
                  {getIcon()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">{media.file.name}</h3>
                  <p className="text-xs text-slate-500 uppercase">Full Transcript</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors"
                >
                  <Copy size={16} />
                  <span>Copy</span>
                </button>
                <button 
                  onClick={() => setIsFullView(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 text-slate-200 leading-relaxed whitespace-pre-wrap text-base sm:text-lg italic font-light scroll-smooth custom-scrollbar-wide">
              {media.transcript}
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl flex justify-center">
               <button 
                onClick={() => setIsFullView(false)}
                className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
