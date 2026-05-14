// frontend/src/hooks/useAudioPlayer.ts
import { useState, useRef, useEffect, useCallback } from 'react';

export interface Track {
  trackId: number;
  title: string;
  creator: string;
  ipfsHash: string;   // CID trên IPFS
  totalTips: bigint;
  isActive: boolean;
  createdAt: bigint;
}

interface AudioPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  progress: number; // 0-100
}

interface AudioPlayerControls {
  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (percent: number) => void;
  setVolume: (vol: number) => void;
  stop: () => void;
}

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export function useAudioPlayer(): AudioPlayerState & AudioPlayerControls {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);

  // Tạo audio element 1 lần
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, []);

  const play = useCallback((track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Nếu đang play track khác → đổi src
    if (currentTrack?.trackId !== track.trackId) {
      audio.src = `${IPFS_GATEWAY}${track.ipfsHash}`;
      audio.load();
    }

    audio.play().then(() => {
      setCurrentTrack(track);
      setIsPlaying(true);
    }).catch(console.error);
  }, [currentTrack]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().then(() => setIsPlaying(true));
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else resume();
  }, [isPlaying, pause, resume]);

  const seek = useCallback((percent: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = (percent / 100) * duration;
  }, [duration]);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) audioRef.current.volume = vol;
    setVolumeState(vol);
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return {
    currentTrack, isPlaying, currentTime, duration, volume, progress,
    play, pause, resume, togglePlay, seek, setVolume, stop,
  };
}