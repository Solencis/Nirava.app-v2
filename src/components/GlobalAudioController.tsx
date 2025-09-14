import React, { useEffect, useRef } from 'react';
import { useAudioStore, AMBIENCES } from '../stores/audioStore';

const GlobalAudioController: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const {
    current,
    isPlaying,
    volume,
    loop,
    tick,
    soundEnabled,
  } = useAudioStore();

  // Tick every second for auto-stop
  useEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  // Handle audio source and basic setup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (current) {
      console.log('Setting up audio:', current.title, current.src);
      audio.src = current.src;
      audio.loop = loop;
      audio.volume = soundEnabled ? volume : 0.01; // Very low but not 0 to avoid issues
      audio.muted = !soundEnabled;
      audio.load();
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [current, loop]);

  // Handle play/pause - simplified without fade effects
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;

    if (isPlaying && soundEnabled) {
      audio.volume = volume;
      audio.muted = false;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('✅ Audio playing:', current.title, 'Duration:', audio.duration);
        }).catch((error) => {
          console.error('❌ Audio play failed:', current.title, error);
        });
      }
    } else {
      audio.pause();
      console.log('⏸️ Audio paused:', current?.title);
    }
  }, [isPlaying, current, soundEnabled]);

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume, soundEnabled]);

  // Handle mute/unmute
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !soundEnabled;
    }
  }, [soundEnabled, volume]);

  // Handle loop changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.loop = loop;
      console.log('🔄 Loop set to:', loop, 'for', current?.title);
    }
  }, [loop]);

  // Handle audio errors
  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const error = e.currentTarget.error;
    console.warn('⚠️ Audio file unavailable for', current?.title, '- switching to silence mode');
    
    // If audio file is missing or corrupted, switch to silence mode instead of stopping
    if (error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || 
        error?.code === MediaError.MEDIA_ERR_DECODE ||
        error?.code === MediaError.MEDIA_ERR_NETWORK) {
      
      const { current: currentTrack } = useAudioStore.getState();
      if (currentTrack && currentTrack.key !== 'silence') {
        console.log('🔇 Switching to silence mode due to audio error');
        // Switch to silence track
        const silenceTrack = AMBIENCES.find(a => a.key === 'silence');
        if (silenceTrack) {
          useAudioStore.getState().play(silenceTrack);
        }
      }
    }
  };

  // Handle when audio can play
  const handleCanPlay = () => {
    const audio = audioRef.current;
    if (audio && current) {
      console.log('✅ Audio ready:', current.title, 'Duration:', audio.duration, 'seconds');
    }
  };
  
  // Handle when audio ends unexpectedly
  const handleEnded = () => {
    console.log('🔚 Audio ended:', current?.title, 'Loop:', audioRef.current?.loop);
  };

  return (
    <audio
      ref={audioRef}
      preload="metadata"
      style={{ display: 'none' }}
      onError={handleError}
      onCanPlay={handleCanPlay}
      onEnded={handleEnded}
      onLoadedMetadata={() => console.log('📊 Metadata loaded:', current?.title, audioRef.current?.duration + 's')}
    />
  );
};

export default GlobalAudioController;