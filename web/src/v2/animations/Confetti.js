import confetti from 'canvas-confetti';

export function fireSuccessConfetti() {
  // Saffron, Turmeric, Deep Teal, Emerald celebratory colors
  const colors = ['#D9580B', '#E8A317', '#03353A', '#10B981', '#FFB596'];

  confetti({
    particleCount: 75,
    spread: 60,
    origin: { y: 0.8 },
    colors
  });

  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors
    });
  }, 150);

  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors
    });
  }, 300);
}

export function fireSyncCelebration() {
  confetti({
    particleCount: 40,
    spread: 45,
    origin: { y: 0.2, x: 0.8 },
    colors: ['#00796B', '#10B981', '#E8A317']
  });
}
