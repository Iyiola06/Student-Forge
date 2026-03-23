'use client';

import Sidebar from '@/components/layout/Sidebar';
import { useEffect, useMemo, useRef, useState } from 'react';

const BOARD_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const INITIAL_SPEED = 140;

type Cell = { x: number; y: number };
type Direction = { x: number; y: number };

function randomFood(snake: Cell[]) {
  while (true) {
    const candidate = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE),
    };

    const blocked = snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y);
    if (!blocked) return candidate;
  }
}

export default function SnakePage() {
  const [snake, setSnake] = useState<Cell[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Cell>({ x: 14, y: 10 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [queuedDirection, setQueuedDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const directionRef = useRef(INITIAL_DIRECTION);

  useEffect(() => {
    const stored = window.localStorage.getItem('snake-best-score');
    if (stored) setBestScore(Number(stored) || 0);
  }, []);

  useEffect(() => {
    directionRef.current = queuedDirection;
  }, [queuedDirection]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(randomFood(INITIAL_SNAKE));
    setDirection(INITIAL_DIRECTION);
    setQueuedDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setIsRunning(false);
    setIsGameOver(false);
    setScore(0);
  };

  const handleDirection = (next: Direction) => {
    const current = directionRef.current;
    if (current.x + next.x === 0 && current.y + next.y === 0) return;
    setQueuedDirection(next);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault();
        if (!isGameOver) setIsRunning((prev) => !prev);
        return;
      }
      if (event.key.toLowerCase() === 'r') {
        resetGame();
        return;
      }

      const mapping: Record<string, Direction> = {
        ArrowUp: { x: 0, y: -1 },
        w: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        d: { x: 1, y: 0 },
      };

      const next = mapping[event.key] || mapping[event.key.toLowerCase()];
      if (next) {
        event.preventDefault();
        handleDirection(next);
        setIsRunning(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isGameOver]);

  useEffect(() => {
    if (!isRunning || isGameOver) return;

    const timer = window.setInterval(() => {
      setSnake((currentSnake) => {
        const nextDirection = directionRef.current;
        setDirection(nextDirection);

        const head = currentSnake[0];
        const nextHead = {
          x: head.x + nextDirection.x,
          y: head.y + nextDirection.y,
        };

        const hitsWall =
          nextHead.x < 0 ||
          nextHead.y < 0 ||
          nextHead.x >= BOARD_SIZE ||
          nextHead.y >= BOARD_SIZE;

        const hitsSelf = currentSnake.some(
          (segment) => segment.x === nextHead.x && segment.y === nextHead.y
        );

        if (hitsWall || hitsSelf) {
          setIsRunning(false);
          setIsGameOver(true);
          setBestScore((prev) => {
            const nextBest = Math.max(prev, score);
            window.localStorage.setItem('snake-best-score', String(nextBest));
            return nextBest;
          });
          return currentSnake;
        }

        const ateFood = nextHead.x === food.x && nextHead.y === food.y;
        const grownSnake = [nextHead, ...currentSnake];

        if (ateFood) {
          setScore((prev) => prev + 10);
          setFood(randomFood(grownSnake));
          setSpeed((prev) => Math.max(75, prev - 4));
          return grownSnake;
        }

        return grownSnake.slice(0, -1);
      });
    }, speed);

    return () => window.clearInterval(timer);
  }, [food.x, food.y, isGameOver, isRunning, score, speed]);

  const cells = useMemo(() => {
    const snakeMap = new Map(snake.map((segment, index) => [`${segment.x}-${segment.y}`, index]));
    return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
      const x = index % BOARD_SIZE;
      const y = Math.floor(index / BOARD_SIZE);
      const key = `${x}-${y}`;
      const snakeIndex = snakeMap.get(key);
      const isFood = food.x === x && food.y === y;
      return { key, isFood, snakeIndex };
    });
  }, [food.x, food.y, snake]);

  const statusText = isGameOver
    ? 'Game over'
    : isRunning
      ? 'Running'
      : 'Ready';

  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col md:flex-row antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:h-screen md:overflow-hidden min-w-0">
        <div className="px-6 pt-10 pb-6 md:px-8 border-b border-slate-200 dark:border-[#2d2d3f] bg-white dark:bg-[#1a1a24] shrink-0">
          <div className="max-w-[1440px] mx-auto w-full">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-[#1a5c2a] bg-[#1a5c2a]/10 p-2 rounded-xl">sports_esports</span>
              Classic Snake
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-3 font-medium">
              Arrow keys or WASD to move. Space to pause. R to reset.
            </p>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-8 max-w-[1440px] mx-auto w-full pb-12">
          <div className="grid gap-8 xl:grid-cols-[360px_1fr]">
            <div className="space-y-6">
              <div className="bg-white/70 dark:bg-[#1a1a24]/80 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">Score</div>
                    <div className="mt-2 text-3xl font-black text-[#1a5c2a]">{score}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">Best</div>
                    <div className="mt-2 text-3xl font-black text-[#5b5bfa]">{bestScore}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">Status</div>
                  <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">{statusText}</div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={() => {
                      if (isGameOver) resetGame();
                      setIsRunning((prev) => !prev);
                    }}
                    className="w-full rounded-2xl bg-[#1a5c2a] hover:bg-[#144823] text-white font-black py-3.5 transition-colors"
                  >
                    {isGameOver ? 'Start Fresh' : isRunning ? 'Pause Game' : 'Start Game'}
                  </button>
                  <button
                    onClick={resetGame}
                    className="w-full rounded-2xl bg-slate-100 dark:bg-[#252535] hover:bg-slate-200 dark:hover:bg-[#2d2d3f] text-slate-700 dark:text-white font-black py-3.5 transition-colors"
                  >
                    Reset Board
                  </button>
                </div>
              </div>

              <div className="bg-white/70 dark:bg-[#1a1a24]/80 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-[#2d2d3f] p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">Mobile Controls</h2>
                <div className="grid grid-cols-3 gap-3 max-w-[240px]">
                  <div />
                  <button onClick={() => handleDirection({ x: 0, y: -1 })} className="rounded-2xl bg-slate-100 dark:bg-[#252535] h-14 flex items-center justify-center text-slate-900 dark:text-white font-black">
                    Up
                  </button>
                  <div />
                  <button onClick={() => handleDirection({ x: -1, y: 0 })} className="rounded-2xl bg-slate-100 dark:bg-[#252535] h-14 flex items-center justify-center text-slate-900 dark:text-white font-black">
                    Left
                  </button>
                  <button onClick={() => setIsRunning((prev) => !prev)} className="rounded-2xl bg-[#5b5bfa] h-14 flex items-center justify-center text-white font-black">
                    {isRunning ? 'II' : 'Go'}
                  </button>
                  <button onClick={() => handleDirection({ x: 1, y: 0 })} className="rounded-2xl bg-slate-100 dark:bg-[#252535] h-14 flex items-center justify-center text-slate-900 dark:text-white font-black">
                    Right
                  </button>
                  <div />
                  <button onClick={() => handleDirection({ x: 0, y: 1 })} className="rounded-2xl bg-slate-100 dark:bg-[#252535] h-14 flex items-center justify-center text-slate-900 dark:text-white font-black">
                    Down
                  </button>
                  <div />
                </div>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-[#1a1a24]/80 backdrop-blur-2xl rounded-[2rem] border border-slate-200 dark:border-[#2d2d3f] p-5 md:p-7 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Arena</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Eat the orange pellets, avoid the walls, and do not bite your tail.
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-slate-600 dark:text-slate-300">
                  Speed {Math.round((200 - speed) / 5) + 1}
                </div>
              </div>

              <div className="aspect-square w-full max-w-[720px] mx-auto rounded-[1.5rem] border border-slate-200 dark:border-[#2d2d3f] bg-[#f8fafc] dark:bg-[#11131b] p-3">
                <div
                  className="grid h-full w-full gap-1"
                  style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
                >
                  {cells.map((cell) => {
                    const isHead = cell.snakeIndex === 0;
                    const isBody = typeof cell.snakeIndex === 'number' && cell.snakeIndex > 0;

                    return (
                      <div
                        key={cell.key}
                        className={`rounded-[0.35rem] transition-colors ${
                          isHead
                            ? 'bg-[#1a5c2a]'
                            : isBody
                              ? 'bg-[#22762f]'
                              : cell.isFood
                                ? 'bg-orange-500'
                                : 'bg-slate-200/70 dark:bg-[#1d2130]'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {isGameOver && (
                <div className="mt-5 rounded-[1.5rem] border border-red-500/20 bg-red-500/10 p-5 text-center">
                  <div className="text-sm font-black uppercase tracking-[0.3em] text-red-400">Game Over</div>
                  <div className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                    Final score: {score}. Press restart and go again.
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
