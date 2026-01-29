
import React, { useState, useEffect } from 'react';
import { Video } from '../types';

interface VideoPlayerProps {
  video: Video;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onPlayStateChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    onPlayStateChange?.(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  const youtubeId = getYouTubeId(video.url);
  const isYoutube = !!youtubeId;

  const handlePlay = () => {
    if (isYoutube || video.url) {
      setIsPlaying(true);
    }
  };

  return (
    <div className="relative w-full aspect-[16/9] bg-slate-950 rounded-[2rem] overflow-hidden shadow-2xl group ring-1 ring-white/10">
      {/* Video Content */}
      <div className="absolute inset-0 z-0">
        {isPlaying ? (
          isYoutube ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          ) : (
            <video 
              className="w-full h-full object-contain" 
              controls
              autoPlay
              playsInline
            >
              <source src={video.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )
        ) : (
          <div 
            className="w-full h-full relative cursor-pointer group/poster"
            onClick={handlePlay}
          >
            {/* Poster Background */}
            <div className="absolute inset-0 bg-slate-900">
              {video.thumbnail ? (
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover/poster:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                   <svg className="w-20 h-20 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                   </svg>
                </div>
              )}
            </div>

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/poster:bg-black/40 transition-colors">
              <div className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 group-hover/poster:scale-110 group-hover/poster:bg-indigo-500 ring-4 ring-white/20">
                <svg className="w-8 h-8 ml-1 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>

            {/* Bottom Label */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
               <span className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/10">
                 Ready to Stream
               </span>
               <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                 {video.duration}
               </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
