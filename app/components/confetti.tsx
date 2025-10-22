import { motion } from "framer-motion";
import { useMemo } from "react";

interface ConfettiProps {
  id: string;
  onComplete?: () => void;
}

const colors = [
  "#6366f1", // indigo-500
  "#818cf8", // indigo-400
  "#c7d2fe", // indigo-200
  "#ec4899", // pink-500
  "#f472b6", // pink-400
  "#fbcfe8", // pink-200
  "#fbbf24", // amber-400
  "#fcd34d", // amber-300
  "#fef08a", // yellow-200
  "#60a5fa", // blue-400
  "#93c5fd", // blue-300
  "#dbeafe", // blue-100
  "#10b981", // emerald-500
  "#34d399", // emerald-400
  "#a78bfa", // violet-400
  "#c4b5fd", // violet-300
  "#f97316", // orange-500
  "#fb923c", // orange-400
];

// Generate random confetti pieces with gravity
const generateConfetti = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    // Burst outward in an oblong/horizontal pattern (wider than tall)
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;

    // Make horizontal velocity 2-3x stronger than vertical for oblong shape
    const horizontalVelocity = 80 + Math.random() * 40;
    const verticalVelocity = 40 + Math.random() * 15;

    const initialX = Math.cos(angle) * horizontalVelocity;
    const initialY = Math.sin(angle) * verticalVelocity;

    return {
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      initialX,
      initialY,
      finalY: initialY, // Float downward gently
      rotation: Math.random() * 720 - 360,
      scale: 0.7 + Math.random() * 0.6,
      delay: Math.random() * 0.08,
      shape: Math.random() > 0.5 ? "circle" : "square",
    };
  });
};

export function Confetti({ id, onComplete }: ConfettiProps) {
  // Generate pieces once per burst using useMemo to prevent regeneration
  const pieces = useMemo(() => generateConfetti(20), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {pieces.map((piece) => (
        <motion.div
          key={`${id}-${piece.id}`}
          initial={{
            x: 0,
            y: 0,
            rotate: 0,
            scale: 0,
          }}
          animate={{
            x: piece.initialX,
            y: piece.finalY,
            rotate: piece.rotation,
            scale: [0, piece.scale, 0],
          }}
          transition={{
            duration: 1.2,
            delay: piece.delay,
            ease: [0.2, 0.8, 0.2, 1], // Quick explosive start, slow drift end
            scale: {
              duration: 1.2,
              delay: piece.delay,
              times: [0, 0.1, 1],
              ease: ["easeOut", [0.4, 0, 0.6, 1]], // Pop in instantly, shrink slowly
            },
          }}
          onAnimationComplete={() => {
            if (piece.id === pieces.length - 1 && onComplete) {
              onComplete();
            }
          }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "12px",
            height: "12px",
            backgroundColor: piece.color,
            borderRadius: piece.shape === "circle" ? "50%" : "3px",
          }}
        />
      ))}
    </div>
  );
}
