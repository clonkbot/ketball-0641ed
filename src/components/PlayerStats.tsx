import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Player {
  _id: string;
  username: string;
  avatarColor: string;
  wins: number;
  losses: number;
  totalPoints: number;
  hotStreak: number;
  bestStreak: number;
  gamesPlayed: number;
  createdAt: number;
}

interface GamePlayer {
  _id: string;
  username: string;
  avatarColor: string;
}

interface RecentGame {
  _id: string;
  player1Id: string;
  player2Id?: string;
  player1Score: number;
  player2Score: number;
  winnerId?: string;
  finishedAt?: number;
  player1: GamePlayer | null;
  player2: GamePlayer | null;
}

interface PlayerStatsProps {
  player: Player;
}

export function PlayerStats({ player }: PlayerStatsProps) {
  const recentGames = useQuery(api.games.getRecentGames, {
    playerId: player._id as any,
    limit: 10,
  }) as RecentGame[] | undefined;

  const winRate = player.gamesPlayed > 0
    ? Math.round((player.wins / player.gamesPlayed) * 100)
    : 0;

  const avgPoints = player.gamesPlayed > 0
    ? Math.round(player.totalPoints / player.gamesPlayed)
    : 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Player header */}
      <div className="text-center mb-8">
        <div
          className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full flex items-center justify-center text-3xl md:text-4xl font-bold mb-4"
          style={{
            background: player.avatarColor,
            boxShadow: `0 0 40px ${player.avatarColor}40`,
            fontFamily: "'Bebas Neue', sans-serif",
          }}
        >
          {player.username.charAt(0).toUpperCase()}
        </div>
        <h2
          className="text-3xl md:text-4xl font-bold"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          {player.username}
        </h2>
        <p className="text-white/50 text-sm mt-1" style={{ fontFamily: "'Russo One', sans-serif" }}>
          Playing since {new Date(player.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard label="WINS" value={player.wins} color="#ffd700" icon="🏆" />
        <StatCard label="LOSSES" value={player.losses} color="#ff3366" icon="💀" />
        <StatCard label="WIN RATE" value={`${winRate}%`} color="#00ff88" icon="📈" />
        <StatCard label="TOTAL PTS" value={player.totalPoints} color="#ff6b00" icon="🏀" />
        <StatCard label="AVG PTS" value={avgPoints} color="#00d4ff" icon="📊" />
        <StatCard label="GAMES" value={player.gamesPlayed} color="#9933ff" icon="🎮" />
        <StatCard label="HOT STREAK" value={player.hotStreak} color="#ff6b00" icon="🔥" />
        <StatCard label="BEST STREAK" value={player.bestStreak} color="#ffd700" icon="⚡" />
      </div>

      {/* Recent games */}
      <div>
        <h3
          className="text-xl md:text-2xl font-bold mb-4"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          RECENT GAMES
        </h3>

        {recentGames === undefined ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentGames.length === 0 ? (
          <div className="text-center text-white/50 py-8" style={{ fontFamily: "'Russo One', sans-serif" }}>
            No games played yet
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {recentGames.map((game: RecentGame) => {
              const isPlayer1 = game.player1Id === player._id;
              const myScore = isPlayer1 ? game.player1Score : game.player2Score;
              const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;
              const opponent = isPlayer1 ? game.player2 : game.player1;
              const won = game.winnerId === player._id;
              const isTie = !game.winnerId;

              return (
                <div
                  key={game._id}
                  className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl"
                  style={{
                    background: won
                      ? "rgba(0, 255, 136, 0.1)"
                      : isTie
                      ? "rgba(255, 215, 0, 0.1)"
                      : "rgba(255, 51, 102, 0.1)",
                    border: `1px solid ${won ? "#00ff88" : isTie ? "#ffd700" : "#ff3366"}30`,
                  }}
                >
                  {/* Result indicator */}
                  <div
                    className="w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center font-bold shrink-0"
                    style={{
                      background: won
                        ? "rgba(0, 255, 136, 0.2)"
                        : isTie
                        ? "rgba(255, 215, 0, 0.2)"
                        : "rgba(255, 51, 102, 0.2)",
                      fontFamily: "'Bebas Neue', sans-serif",
                      color: won ? "#00ff88" : isTie ? "#ffd700" : "#ff3366",
                    }}
                  >
                    {won ? "W" : isTie ? "TIE" : "L"}
                  </div>

                  {/* Opponent info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-sm" style={{ fontFamily: "'Russo One', sans-serif" }}>
                        vs
                      </span>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: opponent?.avatarColor || "#666",
                          fontFamily: "'Bebas Neue', sans-serif",
                        }}
                      >
                        {opponent?.username?.charAt(0) || "?"}
                      </div>
                      <span
                        className="font-bold truncate"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                      >
                        {opponent?.username || "Unknown"}
                      </span>
                    </div>
                    <div className="text-white/40 text-xs" style={{ fontFamily: "'Russo One', sans-serif" }}>
                      {game.finishedAt
                        ? new Date(game.finishedAt).toLocaleDateString()
                        : "Recently"}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <div
                      className="text-xl md:text-2xl font-bold"
                      style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                      <span style={{ color: won ? "#00ff88" : isTie ? "#ffd700" : "#ff3366" }}>
                        {myScore}
                      </span>
                      <span className="text-white/30 mx-1">-</span>
                      <span className="text-white/60">{opponentScore}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  color: string;
  icon: string;
}) {
  return (
    <div
      className="p-3 md:p-4 rounded-xl text-center"
      style={{
        background: "rgba(0, 0, 0, 0.3)",
        border: `1px solid ${color}30`,
      }}
    >
      <div className="text-xl md:text-2xl mb-1">{icon}</div>
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
