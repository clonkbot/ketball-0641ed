import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface GameArenaProps {
  gameId: Id<"games">;
  playerId: Id<"players">;
  onExit: () => void;
}

const GAME_DURATION = 60;
const BALL_SPEED = 6;
const GRAVITY = 0.4;
const JUMP_FORCE = -12;
const PLAYER_SPEED = 5;

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isJumping: boolean;
  headRadius: number;
}

export function GameArena({ gameId, playerId, onExit }: GameArenaProps) {
  const game = useQuery(api.games.getGame, { gameId });
  const scorePoint = useMutation(api.games.scorePoint);
  const endGame = useMutation(api.games.endGame);
  const leaveGame = useMutation(api.games.leaveGame);

  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [localScore, setLocalScore] = useState({ p1: 0, p2: 0 });
  const [showScoreEffect, setShowScoreEffect] = useState<"p1" | "p2" | null>(null);
  const [gameState, setGameState] = useState<"waiting" | "playing" | "ended">("waiting");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const keysRef = useRef<Set<string>>(new Set());

  const ballRef = useRef<Ball>({
    x: 400,
    y: 200,
    vx: (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED,
    vy: 0,
    radius: 20,
  });

  const player1Ref = useRef<Player>({
    x: 100,
    y: 350,
    vx: 0,
    vy: 0,
    width: 40,
    height: 60,
    isJumping: false,
    headRadius: 30,
  });

  const player2Ref = useRef<Player>({
    x: 660,
    y: 350,
    vx: 0,
    vy: 0,
    width: 40,
    height: 60,
    isJumping: false,
    headRadius: 30,
  });

  const isPlayer1 = game?.player1Id === playerId;

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Touch controls for mobile
  const touchControlsRef = useRef({ left: false, right: false, jump: false });

  // Game timer
  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGameState("ended");
          endGame({ gameId });
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, gameId, endGame]);

  // Start game when player 2 joins
  useEffect(() => {
    if (game?.status === "playing" && gameState === "waiting") {
      setGameState("playing");
    }
    if (game?.status === "finished") {
      setGameState("ended");
    }
  }, [game?.status, gameState]);

  // Sync scores from server
  useEffect(() => {
    if (game) {
      setLocalScore({ p1: game.player1Score, p2: game.player2Score });
    }
  }, [game?.player1Score, game?.player2Score]);

  const resetBall = useCallback((scoredOn: "left" | "right") => {
    ballRef.current = {
      x: 400,
      y: 200,
      vx: (scoredOn === "left" ? 1 : -1) * BALL_SPEED,
      vy: 0,
      radius: 20,
    };
  }, []);

  const handleScore = useCallback((scorer: "p1" | "p2") => {
    setShowScoreEffect(scorer);
    setTimeout(() => setShowScoreEffect(null), 1000);

    const points = 2;
    setLocalScore((prev) => ({
      ...prev,
      [scorer]: prev[scorer === "p1" ? "p1" : "p2"] + points,
    }));

    scorePoint({
      gameId,
      playerId: scorer === "p1" ? (game?.player1Id ?? playerId) : (game?.player2Id ?? playerId),
      points,
    });

    resetBall(scorer === "p1" ? "right" : "left");
  }, [gameId, game, playerId, scorePoint, resetBall]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 450;
    const GROUND_Y = 400;
    const HOOP_HEIGHT = 150;
    const HOOP_WIDTH = 60;
    const RIM_Y = 120;

    const gameLoop = () => {
      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw court background
      const courtGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      courtGradient.addColorStop(0, "#1a0f0a");
      courtGradient.addColorStop(1, "#0d0705");
      ctx.fillStyle = courtGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw court floor
      ctx.fillStyle = "#3d2817";
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

      // Draw court lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, GROUND_Y);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();

      // Draw hoops
      const drawHoop = (x: number, isLeft: boolean) => {
        // Backboard
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(isLeft ? x : x - 10, RIM_Y - 60, 10, 80);

        // Rim
        ctx.strokeStyle = "#ff6b00";
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (isLeft) {
          ctx.moveTo(x + 10, RIM_Y);
          ctx.lineTo(x + HOOP_WIDTH, RIM_Y);
        } else {
          ctx.moveTo(x - HOOP_WIDTH, RIM_Y);
          ctx.lineTo(x - 10, RIM_Y);
        }
        ctx.stroke();

        // Net
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1;
        const netStart = isLeft ? x + 10 : x - HOOP_WIDTH;
        const netEnd = isLeft ? x + HOOP_WIDTH : x - 10;
        for (let i = 0; i < 5; i++) {
          const netX = netStart + (netEnd - netStart) * (i / 4);
          ctx.beginPath();
          ctx.moveTo(netX, RIM_Y);
          ctx.lineTo(netX + (isLeft ? 5 : -5), RIM_Y + 40);
          ctx.stroke();
        }

        // Glow effect
        ctx.shadowColor = "#ff6b00";
        ctx.shadowBlur = 20;
        ctx.strokeStyle = "#ff6b00";
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (isLeft) {
          ctx.arc(x + (HOOP_WIDTH / 2) + 5, RIM_Y, 5, 0, Math.PI * 2);
        } else {
          ctx.arc(x - (HOOP_WIDTH / 2) - 5, RIM_Y, 5, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      drawHoop(0, true);
      drawHoop(CANVAS_WIDTH, false);

      // Player controls
      const myPlayer = isPlayer1 ? player1Ref.current : player2Ref.current;
      const controls = touchControlsRef.current;

      if (keysRef.current.has("a") || keysRef.current.has("arrowleft") || controls.left) {
        myPlayer.vx = -PLAYER_SPEED;
      } else if (keysRef.current.has("d") || keysRef.current.has("arrowright") || controls.right) {
        myPlayer.vx = PLAYER_SPEED;
      } else {
        myPlayer.vx = 0;
      }

      if ((keysRef.current.has("w") || keysRef.current.has(" ") || keysRef.current.has("arrowup") || controls.jump) && !myPlayer.isJumping) {
        myPlayer.vy = JUMP_FORCE;
        myPlayer.isJumping = true;
      }

      // Simple AI for opponent (or second player)
      const opponent = isPlayer1 ? player2Ref.current : player1Ref.current;
      const ball = ballRef.current;

      // AI follows ball
      if (ball.x > opponent.x + opponent.width / 2 + 20) {
        opponent.vx = PLAYER_SPEED * 0.7;
      } else if (ball.x < opponent.x + opponent.width / 2 - 20) {
        opponent.vx = -PLAYER_SPEED * 0.7;
      } else {
        opponent.vx = 0;
      }

      // AI jumps when ball is close and above
      if (Math.abs(ball.x - opponent.x) < 100 && ball.y < opponent.y && !opponent.isJumping) {
        opponent.vy = JUMP_FORCE;
        opponent.isJumping = true;
      }

      // Update players
      [player1Ref.current, player2Ref.current].forEach((player, idx) => {
        player.x += player.vx;
        player.y += player.vy;
        player.vy += GRAVITY;

        // Ground collision
        if (player.y > GROUND_Y - player.height) {
          player.y = GROUND_Y - player.height;
          player.vy = 0;
          player.isJumping = false;
        }

        // Wall collision
        const minX = idx === 0 ? 0 : CANVAS_WIDTH / 2 + 20;
        const maxX = idx === 0 ? CANVAS_WIDTH / 2 - 20 : CANVAS_WIDTH;
        if (player.x < minX) player.x = minX;
        if (player.x + player.width > maxX) player.x = maxX - player.width;
      });

      // Update ball
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vy += GRAVITY * 0.5;

      // Ball wall collision
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
      }
      if (ball.x + ball.radius > CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - ball.radius;
        ball.vx = -Math.abs(ball.vx);
      }
      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
      }
      if (ball.y + ball.radius > GROUND_Y) {
        ball.y = GROUND_Y - ball.radius;
        ball.vy = -ball.vy * 0.7;
      }

      // Ball-player collision (head)
      [player1Ref.current, player2Ref.current].forEach((player) => {
        const headX = player.x + player.width / 2;
        const headY = player.y;
        const dx = ball.x - headX;
        const dy = ball.y - headY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ball.radius + player.headRadius) {
          const angle = Math.atan2(dy, dx);
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          ball.vx = Math.cos(angle) * speed * 1.2 + player.vx * 0.5;
          ball.vy = Math.sin(angle) * speed * 1.2 - 5;
          ball.x = headX + Math.cos(angle) * (ball.radius + player.headRadius + 1);
          ball.y = headY + Math.sin(angle) * (ball.radius + player.headRadius + 1);
        }
      });

      // Check for scores
      // Left hoop (player 2 scores)
      if (ball.x < HOOP_WIDTH + 10 && ball.y > RIM_Y - 10 && ball.y < RIM_Y + 40 && ball.vy > 0) {
        handleScore("p2");
      }
      // Right hoop (player 1 scores)
      if (ball.x > CANVAS_WIDTH - HOOP_WIDTH - 10 && ball.y > RIM_Y - 10 && ball.y < RIM_Y + 40 && ball.vy > 0) {
        handleScore("p1");
      }

      // Draw players
      const drawPlayer = (player: Player, color: string, isP1: boolean) => {
        // Body
        ctx.fillStyle = color;
        ctx.fillRect(player.x, player.y + player.headRadius, player.width, player.height - player.headRadius);

        // Head
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y, player.headRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Eyes
        ctx.fillStyle = "white";
        const eyeOffsetX = isP1 ? 8 : -8;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2 + eyeOffsetX, player.y - 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2 + eyeOffsetX + (isP1 ? 2 : -2), player.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y, player.headRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      drawPlayer(player1Ref.current, game?.player1?.avatarColor || "#ff6b00", true);
      drawPlayer(player2Ref.current, game?.player2?.avatarColor || "#00d4ff", false);

      // Draw ball
      const ballGradient = ctx.createRadialGradient(
        ball.x - 5, ball.y - 5, 0,
        ball.x, ball.y, ball.radius
      );
      ballGradient.addColorStop(0, "#ff8533");
      ballGradient.addColorStop(1, "#cc5500");
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = ballGradient;
      ctx.fill();

      // Ball lines
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ball.x - ball.radius, ball.y);
      ctx.lineTo(ball.x + ball.radius, ball.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y - ball.radius);
      ctx.lineTo(ball.x, ball.y + ball.radius);
      ctx.stroke();

      // Ball glow
      ctx.shadowColor = "#ff6b00";
      ctx.shadowBlur = 20;
      ctx.strokeStyle = "rgba(255, 107, 0, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, isPlayer1, game, handleScore]);

  const handleLeave = () => {
    leaveGame({ gameId, playerId });
    onExit();
  };

  if (gameState === "waiting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full border-4 border-[#ff6b00] border-t-transparent animate-spin" />
          <h2
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            WAITING FOR OPPONENT...
          </h2>
          <p className="text-white/50 mb-8 text-sm md:text-base" style={{ fontFamily: "'Russo One', sans-serif" }}>
            Get ready to ball!
          </p>
          <button
            onClick={handleLeave}
            className="px-6 py-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all min-h-[48px]"
            style={{ fontFamily: "'Russo One', sans-serif" }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (gameState === "ended") {
    const isWinner = game?.winnerId === playerId;
    const isTie = !game?.winnerId;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2
            className="text-4xl md:text-6xl font-bold mb-4"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              color: isTie ? "#ffd700" : isWinner ? "#00ff88" : "#ff3366",
            }}
          >
            {isTie ? "IT'S A TIE!" : isWinner ? "YOU WIN!" : "YOU LOSE!"}
          </h2>

          <div className="flex justify-center gap-8 md:gap-16 mb-8">
            <div className="text-center">
              <div
                className="text-4xl md:text-6xl font-bold"
                style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#ff6b00" }}
              >
                {localScore.p1}
              </div>
              <div className="text-white/50 text-sm" style={{ fontFamily: "'Russo One', sans-serif" }}>
                {game?.player1?.username || "Player 1"}
              </div>
            </div>
            <div className="text-white/30 text-4xl md:text-6xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              -
            </div>
            <div className="text-center">
              <div
                className="text-4xl md:text-6xl font-bold"
                style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#00d4ff" }}
              >
                {localScore.p2}
              </div>
              <div className="text-white/50 text-sm" style={{ fontFamily: "'Russo One', sans-serif" }}>
                {game?.player2?.username || "Player 2"}
              </div>
            </div>
          </div>

          <button
            onClick={onExit}
            className="px-8 md:px-12 py-3 md:py-4 rounded-xl font-bold text-xl md:text-2xl tracking-wider transition-all min-h-[56px]"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              background: 'linear-gradient(135deg, #ff6b00 0%, #cc5500 100%)',
              boxShadow: '0 8px 32px rgba(255, 107, 0, 0.4)',
            }}
          >
            BACK TO LOBBY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-2 md:p-4">
      {/* Game header */}
      <div className="flex justify-between items-center mb-2 md:mb-4 px-2">
        <div className="flex items-center gap-2 md:gap-3">
          <div
            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold"
            style={{
              background: game?.player1?.avatarColor || "#ff6b00",
              fontFamily: "'Bebas Neue', sans-serif",
            }}
          >
            {game?.player1?.username?.charAt(0) || "P"}
          </div>
          <span className="text-sm md:text-base text-white/80" style={{ fontFamily: "'Russo One', sans-serif" }}>
            <span className="hidden sm:inline">{game?.player1?.username || "Player 1"}</span>
            <span className="sm:hidden">{game?.player1?.username?.slice(0, 6) || "P1"}</span>
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3 md:gap-6">
          <div
            className={`text-3xl md:text-5xl font-bold transition-all ${showScoreEffect === "p1" ? "scale-125 text-[#ffd700]" : "text-[#ff6b00]"}`}
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {localScore.p1}
          </div>
          <div
            className="text-xl md:text-3xl font-bold px-3 md:px-4 py-1 md:py-2 rounded-lg"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              background: timeLeft <= 10 ? "rgba(255, 51, 102, 0.3)" : "rgba(255, 255, 255, 0.1)",
              color: timeLeft <= 10 ? "#ff3366" : "white",
            }}
          >
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </div>
          <div
            className={`text-3xl md:text-5xl font-bold transition-all ${showScoreEffect === "p2" ? "scale-125 text-[#ffd700]" : "text-[#00d4ff]"}`}
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {localScore.p2}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-sm md:text-base text-white/80" style={{ fontFamily: "'Russo One', sans-serif" }}>
            <span className="hidden sm:inline">{game?.player2?.username || "CPU"}</span>
            <span className="sm:hidden">{game?.player2?.username?.slice(0, 6) || "CPU"}</span>
          </span>
          <div
            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold"
            style={{
              background: game?.player2?.avatarColor || "#00d4ff",
              fontFamily: "'Bebas Neue', sans-serif",
            }}
          >
            {game?.player2?.username?.charAt(0) || "C"}
          </div>
        </div>
      </div>

      {/* Game canvas */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className="relative w-full max-w-4xl rounded-2xl overflow-hidden"
          style={{
            border: "3px solid rgba(255, 107, 0, 0.3)",
            boxShadow: "0 0 60px rgba(255, 107, 0, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.5)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={450}
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Mobile touch controls */}
      <div className="md:hidden flex justify-between items-center mt-4 px-4">
        <div className="flex gap-2">
          <button
            className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-2xl active:bg-[#ff6b00]/30"
            onTouchStart={() => (touchControlsRef.current.left = true)}
            onTouchEnd={() => (touchControlsRef.current.left = false)}
          >
            ←
          </button>
          <button
            className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-2xl active:bg-[#ff6b00]/30"
            onTouchStart={() => (touchControlsRef.current.right = true)}
            onTouchEnd={() => (touchControlsRef.current.right = false)}
          >
            →
          </button>
        </div>
        <button
          className="w-20 h-20 rounded-full bg-[#ff6b00]/20 border-2 border-[#ff6b00]/50 flex items-center justify-center text-3xl active:bg-[#ff6b00]/40"
          onTouchStart={() => (touchControlsRef.current.jump = true)}
          onTouchEnd={() => (touchControlsRef.current.jump = false)}
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          ↑
        </button>
      </div>

      {/* Controls hint */}
      <div className="hidden md:block text-center mt-4 text-white/40 text-sm" style={{ fontFamily: "'Russo One', sans-serif" }}>
        Use A/D or Arrow Keys to move • W or Space to jump
      </div>
    </div>
  );
}
