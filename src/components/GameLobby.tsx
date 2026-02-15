import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Leaderboard } from "./Leaderboard";
import { GameArena } from "./GameArena";
import { PlayerStats } from "./PlayerStats";
import { Id } from "../../convex/_generated/dataModel";

export function GameLobby() {
  const { signOut } = useAuthActions();
  const player = useQuery(api.players.getCurrentPlayer);
  const getOrCreatePlayer = useMutation(api.players.getOrCreatePlayer);
  const findOrCreateGame = useMutation(api.games.findOrCreateGame);

  const [activeGameId, setActiveGameId] = useState<Id<"games"> | null>(null);
  const [view, setView] = useState<"lobby" | "game" | "leaderboard" | "stats">("lobby");
  const [isSearching, setIsSearching] = useState(false);

  // Ensure player exists
  useEffect(() => {
    if (player === null) {
      getOrCreatePlayer();
    }
  }, [player, getOrCreatePlayer]);

  // Check for active game
  const activeGame = useQuery(
    api.games.getActiveGame,
    player ? { playerId: player._id } : "skip"
  );

  useEffect(() => {
    if (activeGame && activeGame.status !== "finished") {
      setActiveGameId(activeGame._id);
      setView("game");
      setIsSearching(false);
    }
  }, [activeGame]);

  const handleFindGame = async () => {
    if (!player) return;
    setIsSearching(true);
    try {
      const gameId = await findOrCreateGame({ playerId: player._id });
      setActiveGameId(gameId);
      setView("game");
    } catch (err) {
      console.error("Failed to find game:", err);
      setIsSearching(false);
    }
  };

  const handleGameEnd = () => {
    setActiveGameId(null);
    setView("lobby");
    setIsSearching(false);
  };

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[#ff6b00] text-xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          LOADING PLAYER...
        </div>
      </div>
    );
  }

  if (view === "game" && activeGameId) {
    return <GameArena gameId={activeGameId} playerId={player._id} onExit={handleGameEnd} />;
  }

  if (view === "leaderboard") {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <button
          onClick={() => setView("lobby")}
          className="mb-6 flex items-center gap-2 text-white/60 hover:text-[#00d4ff] transition-colors py-2"
          style={{ fontFamily: "'Russo One', sans-serif" }}
        >
          <span className="text-xl">&larr;</span> Back to Lobby
        </button>
        <Leaderboard currentPlayerId={player._id} />
        <Footer />
      </div>
    );
  }

  if (view === "stats") {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <button
          onClick={() => setView("lobby")}
          className="mb-6 flex items-center gap-2 text-white/60 hover:text-[#00d4ff] transition-colors py-2"
          style={{ fontFamily: "'Russo One', sans-serif" }}
        >
          <span className="text-xl">&larr;</span> Back to Lobby
        </button>
        <PlayerStats player={player} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 md:mb-12">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Player avatar */}
          <div
            className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold shrink-0"
            style={{
              background: player.avatarColor,
              boxShadow: `0 0 20px ${player.avatarColor}40`,
              fontFamily: "'Bebas Neue', sans-serif",
            }}
          >
            {player.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2
              className="text-xl md:text-2xl font-bold"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {player.username}
            </h2>
            <p className="text-white/50 text-xs md:text-sm" style={{ fontFamily: "'Russo One', sans-serif" }}>
              {player.wins}W - {player.losses}L
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 md:px-6 md:py-2 rounded-lg border border-white/20 text-white/60 hover:border-red-500/50 hover:text-red-400 transition-all text-sm min-h-[44px]"
          style={{ fontFamily: "'Russo One', sans-serif" }}
        >
          Sign Out
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center -mt-8 md:-mt-16">
        {/* Logo */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-wider mb-6 md:mb-8"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          <span
            style={{
              background: 'linear-gradient(180deg, #ff6b00 0%, #ff9500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            KET
          </span>
          <span
            style={{
              background: 'linear-gradient(180deg, #00d4ff 0%, #00a3cc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            BALL
          </span>
        </h1>

        {/* Play button */}
        <button
          onClick={handleFindGame}
          disabled={isSearching}
          className="relative group mb-8 md:mb-12 min-h-[60px]"
        >
          <div
            className="absolute inset-0 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #ff6b00 0%, #ff9500 100%)' }}
          />
          <div
            className="relative px-12 md:px-16 py-4 md:py-5 rounded-2xl font-bold text-2xl md:text-3xl tracking-wider transition-transform group-hover:scale-105 group-active:scale-95"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              background: 'linear-gradient(135deg, #ff6b00 0%, #cc5500 100%)',
              boxShadow: '0 8px 32px rgba(255, 107, 0, 0.4)',
            }}
          >
            {isSearching ? (
              <span className="flex items-center gap-3">
                <span className="w-5 h-5 md:w-6 md:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                SEARCHING...
              </span>
            ) : (
              "PLAY NOW"
            )}
          </div>
        </button>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12 w-full max-w-md">
          <StatBox label="WINS" value={player.wins} color="#ffd700" />
          <StatBox label="POINTS" value={player.totalPoints} color="#ff6b00" />
          <StatBox label="STREAK" value={player.hotStreak} color="#00d4ff" />
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full max-w-md">
          <NavButton onClick={() => setView("leaderboard")} icon="🏆" label="LEADERBOARD" />
          <NavButton onClick={() => setView("stats")} icon="📊" label="MY STATS" />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="text-center p-3 md:p-4 rounded-xl"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: `1px solid ${color}30`,
      }}
    >
      <div
        className="text-2xl md:text-3xl font-bold"
        style={{ fontFamily: "'Bebas Neue', sans-serif", color }}
      >
        {value}
      </div>
      <div
        className="text-white/50 text-[10px] md:text-xs tracking-wider"
        style={{ fontFamily: "'Russo One', sans-serif" }}
      >
        {label}
      </div>
    </div>
  );
}

function NavButton({ onClick, icon, label }: { onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 rounded-xl border border-white/10 hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/5 transition-all min-h-[48px]"
      style={{ fontFamily: "'Russo One', sans-serif" }}
    >
      <span className="text-xl md:text-2xl">{icon}</span>
      <span className="text-sm md:text-base text-white/80">{label}</span>
    </button>
  );
}

function Footer() {
  return (
    <footer className="mt-8 md:mt-12 text-center text-white/30 text-xs pb-4">
      <p>Requested by @y994638341685 · Built by @clonkbot</p>
    </footer>
  );
}
