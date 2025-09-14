import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAudioStore } from '../stores/audioStore';

interface AudioPlayerProps {
  title: string;
  audioSrc: string;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ title, audioSrc, className = '' }) => {
  const { soundEnabled } = useAudioStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(!soundEnabled);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    // Update muted state based on global sound setting
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !soundEnabled;
      setIsMuted(!soundEnabled);
    }
  }, [soundEnabled]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white/90 rounded-xl p-4 border border-stone/10 ${className}`}>
      <audio ref={audioRef} src={audioSrc} preload="metadata" />
      
      <div className="flex items-center space-x-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 bg-jade text-white rounded-full flex items-center justify-center hover:bg-jade/90 transition-colors duration-300"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-ink truncate">{title}</span>
            <button
              onClick={toggleMute}
              className="text-stone hover:text-jade transition-colors duration-300"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-stone">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-stone/20 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #059669 0%, #059669 ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
              }}
            />
            <span className="text-xs text-stone">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;