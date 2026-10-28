import React, { useState, useRef, useEffect } from 'react';
import {
  Cpu,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  Terminal,
} from 'lucide-react';
import type {
  SupportedChannel,
  McpToolExecutionTrace,
} from '../../entities/omnichannel/types';

export const CHANNEL_META: Record<
  SupportedChannel,
  {
    label: string;
    shortLabel: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    accentHex: string;
    placeholderHandle: string;
  }
> = {
  WHATSAPP: {
    label: 'WhatsApp',
    shortLabel: 'WA',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    accentHex: '#10b981',
    placeholderHandle: '+593 99 842 1102',
  },
  INSTAGRAM: {
    label: 'Instagram DM',
    shortLabel: 'IG',
    bgClass: 'bg-pink-500/15',
    textClass: 'text-pink-400',
    borderClass: 'border-pink-500/30',
    accentHex: '#ec4899',
    placeholderHandle: '@camila.edtech',
  },
  FACEBOOK: {
    label: 'Messenger',
    shortLabel: 'FB',
    bgClass: 'bg-blue-500/15',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
    accentHex: '#3b82f6',
    placeholderHandle: 'fb.com/diego.morales',
  },
  TIKTOK: {
    label: 'TikTok DM',
    shortLabel: 'TK',
    bgClass: 'bg-cyan-500/15',
    textClass: 'text-cyan-300',
    borderClass: 'border-cyan-400/30',
    accentHex: '#06b6d4',
    placeholderHandle: '@valeria.devs',
  },
};

export function ChannelIcon({
  channel,
  className = 'w-4 h-4',
}: {
  channel: SupportedChannel;
  className?: string;
}) {
  if (channel === 'WHATSAPP') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.625.846 5.059 2.284 7.033l-1.492 5.451 5.604-1.47c1.906 1.253 4.187 1.986 6.604 1.986 6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
      </svg>
    );
  }
  if (channel === 'INSTAGRAM') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  if (channel === 'FACEBOOK') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.454 5.512 3.726 7.21V22l3.405-1.869c.909.252 1.871.388 2.869.388 5.523 0 10-4.145 10-9.259S17.523 2 12 2zm1.007 12.465l-2.548-2.718-4.972 2.718 5.469-5.805 2.61 2.718 4.91-2.718-5.469 5.805z" />
      </svg>
    );
  }
  // TIKTOK
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export function ChannelBadge({
  channel,
  compact = false,
}: {
  channel: SupportedChannel;
  compact?: boolean;
}) {
  const meta = CHANNEL_META[channel] || CHANNEL_META.WHATSAPP;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
    >
      <ChannelIcon channel={channel} className="w-3 h-3" />
      <span>{compact ? meta.shortLabel : meta.label}</span>
    </span>
  );
}

function formatAudioTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export function AudioPlayer({ src, isAgent }: { src: string; isAgent: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-2.5 min-w-[220px] py-1">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition ${
          isAgent
            ? 'bg-white/20 text-white hover:bg-white/30'
            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
        }`}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <input
          type="range"
          min={0}
          max={duration || 10}
          step={0.1}
          value={currentTime}
          onChange={(e) => {
            const t = Number(e.target.value);
            if (audioRef.current) audioRef.current.currentTime = t;
            setCurrentTime(t);
          }}
          className="w-full h-1 cursor-pointer accent-emerald-400"
        />
        <span className="text-[10px] opacity-75 font-mono">
          {formatAudioTime(currentTime)} / {formatAudioTime(duration || 12)}
        </span>
      </div>
    </div>
  );
}

export function McpTraceCard({ trace }: { trace: McpToolExecutionTrace }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2 rounded-lg border border-indigo-500/30 bg-slate-950/80 text-slate-200 overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-indigo-500/10 transition text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-mono font-semibold text-indigo-300 truncate">
            {trace.toolName}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px]">
            {trace.serverName}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
            <CheckCircle2 className="w-3 h-3" />
            {trace.latencyMs}ms
          </span>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 py-2.5 border-t border-indigo-500/20 space-y-2 bg-slate-950 font-mono text-[11px]">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Terminal className="w-3 h-3" /> Input Arguments
            </div>
            <pre className="p-2 rounded bg-slate-900/90 text-amber-300 overflow-x-auto">
              {JSON.stringify(trace.arguments, null, 2)}
            </pre>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> MCP Output Payload
            </div>
            <pre className="p-2 rounded bg-slate-900/90 text-emerald-300 overflow-x-auto">
              {JSON.stringify(trace.result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
