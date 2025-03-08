// Audio cache to prevent creating new Audio objects for each shot
const audioCache: { [key: string]: HTMLAudioElement } = {};

// Background music instance
let bgMusic: HTMLAudioElement | null = null;

export const playSound = (soundPath: string) => {
  // Check if sound is already cached
  if (!audioCache[soundPath]) {
    audioCache[soundPath] = new Audio(soundPath);
  }
  
  // Reset and play the sound
  const audio = audioCache[soundPath];
  audio.currentTime = 0;
  audio.play().catch(() => {
    // Ignore errors (e.g., if user hasn't interacted with page yet)
  });
};

export const startBackgroundMusic = () => {
  if (!bgMusic) {
    bgMusic = new Audio('/spaceinvadersmainmusic.mp3');
    bgMusic.volume = 0;
  }
  
  // Reset and start playing
  bgMusic.currentTime = 0;
  bgMusic.play().then(() => {
    // Fade in
    let volume = 0;
    const fadeIn = setInterval(() => {
      if (volume < 1) {
        volume = Math.min(1, volume + 0.1);
        if (bgMusic) bgMusic.volume = volume;
      } else {
        clearInterval(fadeIn);
      }
    }, 100);
  }).catch(() => {
    // Ignore errors
  });
};

export const fadeOutBackgroundMusic = () => {
  if (!bgMusic) return;

  return new Promise<void>((resolve) => {
    let volume = bgMusic.volume;
    const fadeOut = setInterval(() => {
      if (volume > 0) {
        volume = Math.max(0, volume - 0.1);
        if (bgMusic) bgMusic.volume = volume;
      } else {
        clearInterval(fadeOut);
        if (bgMusic) bgMusic.pause();
        resolve();
      }
    }, 100);
  });
}; 