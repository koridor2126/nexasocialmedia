import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Eye } from 'lucide-react';
import { api } from '../../services/api.js';

interface VideoPlayerProps {
  postId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  onViewIncrement?: (newCount: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  postId,
  videoUrl,
  thumbnailUrl,
  viewCount,
  likeCount,
  commentCount,
  shareCount,
  onViewIncrement
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [hasRecordedView, setHasRecordedView] = useState<boolean>(false);
  const [localViews, setLocalViews] = useState<number>(viewCount);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    setLocalViews(viewCount);
  }, [viewCount]);

  const handlePlayToggle = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        // Record view logically upon intentional interaction / playback
        if (!hasRecordedView) {
          setHasRecordedView(true);
          api.recordView(postId).then(res => {
            if (res.view_count) {
              setLocalViews(res.view_count);
              onViewIncrement?.(res.view_count);
            }
          }).catch(() => {});
        }
      }).catch(err => {
        console.warn('Video play error:', err);
      });
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('id-ID').format(num || 0);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-100/50 shadow-xs">
      {/* Video Container */}
      <div 
        onClick={handlePlayToggle}
        className="relative aspect-video sm:aspect-video w-full bg-slate-950 cursor-pointer group flex items-center justify-center"
      >
        {/* Top Left Video Badge */}
        <div className="absolute top-2.5 left-2.5 z-10 bg-black/50 backdrop-blur-md text-white text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span>Video</span>
        </div>

        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          className="w-full h-full object-cover"
        />

        {/* Play/Pause Overlay button when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] flex items-center justify-center transition-all group-hover:bg-black/35">
            <div className="w-13 h-13 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-xl transition-transform group-hover:scale-110 pl-0.5">
              <Play className="w-5 h-5 fill-current text-[#1A1A1A]" />
            </div>
          </div>
        )}

        {/* Video Controls Badges & Mute */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
          <button
            onClick={handleMuteToggle}
            aria-label={isMuted ? 'Aktifkan Suara' : 'Bisukan Suara'}
            className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Video scrubbing bar */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-indigo-600 transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Engagement Stats Bar below video */}
      <div className="px-3.5 py-2 bg-[#FAFAFB] border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
        <div className="flex items-center gap-1.5 text-gray-700 font-semibold truncate">
          <Eye className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span>{formatNumber(localViews)} tayangan</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
          <span>·</span>
          <span>{formatNumber(likeCount)} suka</span>
          <span>·</span>
          <span>{formatNumber(commentCount)} komentar</span>
          <span>·</span>
          <span>{formatNumber(shareCount)} dibagikan</span>
        </div>
      </div>
    </div>
  );
};
