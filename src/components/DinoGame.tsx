import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Award } from 'lucide-react';

interface DinoGameProps {
  onGameActiveChange?: (active: boolean) => void;
}

export const DinoGame: React.FC<DinoGameProps> = ({ onGameActiveChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      const stored = localStorage.getItem('aura_dino_highscore');
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const stateRef = useRef({
    isPlaying: false,
    isGameOver: false,
    dinoY: 0,
    dinoVelocityY: 0,
    obstacles: [] as { x: number; width: number; height: number }[],
    score: 0,
    frameCount: 0,
    nextObstacleDist: 220,
    groundOffset: 0,
  });

  // Keep ref up-to-date
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.isGameOver = isGameOver;
    if (onGameActiveChange) {
      onGameActiveChange(isPlaying);
    }
  }, [isPlaying, isGameOver, onGameActiveChange]);

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);

    stateRef.current = {
      isPlaying: true,
      isGameOver: false,
      dinoY: 0,
      dinoVelocityY: 0,
      obstacles: [],
      score: 0,
      frameCount: 0,
      nextObstacleDist: 220,
      groundOffset: 0,
    };
  };

  const triggerJump = () => {
    if (!stateRef.current.isPlaying || stateRef.current.isGameOver) return;
    if (stateRef.current.dinoY === 0) {
      stateRef.current.dinoVelocityY = 13.5; // Optimized crisp jump impulse (matched with 0.85 gravity)
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!stateRef.current.isPlaying && !stateRef.current.isGameOver) {
          startGame();
        } else if (stateRef.current.isGameOver) {
          startGame();
        } else {
          triggerJump();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main canvas render loop
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed internal engine dimensions
    const width = 480;
    const height = 150;
    canvas.width = width;
    canvas.height = height;

    const gravity = 0.85;
    const runLoop = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Ground
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height - 15);
      ctx.lineTo(width, height - 15);
      ctx.stroke();

      // Simple ground dots for speed perception (synced to absolute offset)
      ctx.fillStyle = '#64748b';
      for (let i = 0; i < width; i += 40) {
        const dotX = i - (stateRef.current.isPlaying && !stateRef.current.isGameOver ? stateRef.current.groundOffset : 0);
        ctx.fillRect(dotX, height - 12, 2, 2);
        ctx.fillRect(dotX + 15, height - 8, 3, 2);
      }

      // Update state if playing
      if (stateRef.current.isPlaying && !stateRef.current.isGameOver) {
        stateRef.current.frameCount++;

        // Speed increments at higher scores to increase difficulty cleanly
        const currentSpeed = 5.5 + Math.floor(stateRef.current.score / 150) * 0.5;
        stateRef.current.groundOffset = (stateRef.current.groundOffset + currentSpeed) % 40;

        // Update Dino physics
        stateRef.current.dinoVelocityY -= gravity;
        stateRef.current.dinoY += stateRef.current.dinoVelocityY;
        if (stateRef.current.dinoY < 0) {
          stateRef.current.dinoY = 0;
          stateRef.current.dinoVelocityY = 0;
        }

        // Generate Cactus Obstacles - slightly further spaced out for the snappier pacing
        if (stateRef.current.obstacles.length === 0 || 
            width - stateRef.current.obstacles[stateRef.current.obstacles.length - 1].x > stateRef.current.nextObstacleDist) {
          const cactusHeight = 18 + Math.random() * 18;
          const cactusWidth = 10 + Math.random() * 10;
          stateRef.current.obstacles.push({
            x: width,
            width: cactusWidth,
            height: cactusHeight
          });
          stateRef.current.nextObstacleDist = 200 + Math.random() * 160;
        }

        // Update Obstacles position & speed
        stateRef.current.obstacles = stateRef.current.obstacles.map(obs => {
          return { ...obs, x: obs.x - currentSpeed };
        }).filter(obs => obs.x + obs.width > 0);

        // Update Score
        if (stateRef.current.frameCount % 5 === 0) {
          stateRef.current.score += 1;
          setScore(stateRef.current.score);
        }

        // Collision Check
        const dinoLeft = 40;
        const dinoRight = 40 + 20;
        const dinoBottom = height - 15;
        const dinoTop = height - 15 - 24 - stateRef.current.dinoY;

        for (const obs of stateRef.current.obstacles) {
          const obsLeft = obs.x;
          const obsRight = obs.x + obs.width;
          const obsTop = height - 15 - obs.height;

          // Box collision
          if (
            dinoRight > obsLeft + 2 &&
            dinoLeft < obsRight - 2 &&
            dinoBottom - stateRef.current.dinoY > obsTop + 2
          ) {
            // Collision detected!
            stateRef.current.isGameOver = true;
            setIsGameOver(true);
            setHighScore(prev => {
              const nextHigh = Math.max(prev, stateRef.current.score);
              try {
                localStorage.setItem('aura_dino_highscore', nextHigh.toString());
              } catch {}
              return nextHigh;
            });
          }
        }
      }

      // Draw Dino (Classy Minimalist Pixel Block)
      const dinoDrawY = height - 15 - 24 - stateRef.current.dinoY;
      ctx.fillStyle = '#ffffff'; // Pristine high-visibility white
      ctx.beginPath();
      // Body block
      ctx.fillRect(40, dinoDrawY, 18, 20);
      // Head and snout
      ctx.fillRect(48, dinoDrawY - 6, 14, 10);
      // Snout block accent
      ctx.fillStyle = '#cbd5e1'; // Light grey accent
      ctx.fillRect(56, dinoDrawY - 2, 6, 4);
      // Classy little boots running effect
      ctx.fillStyle = '#94a3b8'; // Medium bright secondary slate for visible movement
      if (stateRef.current.dinoY > 0) {
        ctx.fillRect(43, dinoDrawY + 20, 4, 4);
        ctx.fillRect(51, dinoDrawY + 20, 4, 4);
      } else if (stateRef.current.isPlaying && !stateRef.current.isGameOver && Math.floor(stateRef.current.frameCount / 4) % 2 === 0) {
        ctx.fillRect(41, dinoDrawY + 20, 4, 4);
        ctx.fillRect(52, dinoDrawY + 18, 4, 4);
      } else {
        ctx.fillRect(44, dinoDrawY + 18, 4, 4);
        ctx.fillRect(49, dinoDrawY + 20, 4, 4);
      }

      // Draw Obstacles (Minimal Sage Cacti)
      ctx.fillStyle = '#f8fafc'; // Crisp bright off-white cacti
      stateRef.current.obstacles.forEach(obs => {
        // Main stem
        ctx.fillRect(obs.x, height - 15 - obs.height, obs.width, obs.height);
        // Side branch left
        if (obs.height > 25) {
          ctx.fillRect(obs.x - 4, height - 15 - obs.height + 8, 4, 4);
          ctx.fillRect(obs.x - 4, height - 15 - obs.height + 8, 2, 8);
        }
        // Side branch right
        if (obs.height > 30) {
          ctx.fillRect(obs.x + obs.width, height - 15 - obs.height + 12, 4, 4);
          ctx.fillRect(obs.x + obs.width + 2, height - 15 - obs.height + 12, 2, 6);
        }
      });

      animationId = requestAnimationFrame(runLoop);
    };

    animationId = requestAnimationFrame(runLoop);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-3 bg-neutral-900 rounded-2xl p-4 border border-neutral-800 shadow-inner">
      <div className="w-full flex items-center justify-between font-mono text-[10px] text-neutral-400 font-extrabold select-none">
        <div className="flex items-center gap-1 text-indigo-400">
          <Play className="w-2.5 h-2.5" />
          <span>AURA RUNNER</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-bold">
            <Award className="w-3 h-3 text-yellow-500" /> HI: {highScore.toString().padStart(5, '0')}
          </span>
          <span className="text-white font-extrabold text-[11px]">
            SCORE: {score.toString().padStart(5, '0')}
          </span>
        </div>
      </div>

      <div 
        onClick={triggerJump}
        className="relative w-full max-w-full overflow-hidden cursor-pointer active:scale-[0.99] transition-transform select-none rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-center"
        style={{ height: '150px' }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Start Game State overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 bg-neutral-950/80 flex flex-col items-center justify-center text-center p-4">
            <span className="text-xs font-black tracking-widest text-[#7647eb] uppercase font-mono animate-bounce mb-2">Spacebar or Tap to Start Run</span>
            <span className="text-[10px] text-neutral-400 font-bold max-w-[260px] leading-relaxed">
              Dodge the procedural cacti core nodes to calibrate internal CPU parameters.
            </span>
          </div>
        )}

        {/* Game Over Screen */}
        {isGameOver && (
          <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center text-center p-4">
            <span className="text-sm font-black text-red-400 tracking-wider font-mono">CALIBRATION OFFSET DETECTED</span>
            <span className="text-[11px] font-black text-white font-mono mt-1 mb-3">Score: {score}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-all select-none cursor-pointer outline-none active:scale-95"
            >
              <RotateCcw className="w-3 h-3" /> Retry Synchronization
            </button>
          </div>
        )}
      </div>

      <div className="text-[9px] text-neutral-500 text-center font-bold tracking-tight select-none">
        💡 Tap Canvas or press <kbd className="px-1 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-300">Space</kbd> / <kbd className="px-1 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-300">↑ Arrow</kbd> to dodge obstacles.
      </div>
    </div>
  );
};
