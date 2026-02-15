import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface LeaderboardPlayer {
  _id: Id<"players">;
  username: string;
  avatarColor: string;
  wins: number;
  losses: number;
  totalPoints: number;
  hotStreak: number;
  bestStreak: number;
  gamesPlayed: number;
}

interface LeaderboardProps {
  currentPlayerId: Id<"players">;
}

export function Leaderboard({ currentPlayerId }: LeaderboardProps) {
  const leaderboard = useQuery(api.players.getLeaderboard, { limit: 20 }) as LeaderboardPlayer[] | undefined;

  if (!leaderboard) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2
        className="text-3xl md:text-4xl font-bold text-center mb-6 md:mb-8"
        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
      >
        <span className="text-[#ffd700]">🏆</span> LEADERBOARD
      </h2>

      <div className="space-y-2 md:space-y-3">
        {leaderboard.map((player: LeaderboardPlayer, index: number) => {
          const isCurrentPlayer = player._id === currentPlayerId;
          const isTop3 = index < 3;

          return (
            <div
              key={player._id}
              className={`relative flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl transition-all ${
                isCurrentPlayer ? "ring-2 ring-[#00d4ff]/50" : ""
              }`}
              style={{
                background: isTop3
                  ? `linear-gradient(135deg, rgba(${index === 0 ? "255, 215, 0" : index === 1 ? "192, 192, 192" : "205, 127, 50"}, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)`
                  : "rgba(0, 0, 0, 0.3)",
                border: `1px solid ${isTop3 ? (index === 0 ? "#ffd700" : index === 1 ? "#c0c0c0" : "#cd7f32") : "rgba(255, 255, 255, 0.1)"}30`,
              }}
            >
              {/* Rank */}
              <div
                className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-bold text-lg md:text-xl shrink-0"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  color: index === 0 ? "#ffd700" : index === 1 ? "#c0c0c0" : index === 2 ? "#cd7f32" : "rgba(255, 255, 255, 0.5)",
                }}
              >
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
              </div>

              {/* Avatar */}
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-base md:text-lg shrink-0"
                style={{
                  background: player.avatarColor,
                  boxShadow: isTop3 ? `0 0 20px ${player.avatarColor}40` : "none",
                  fontFamily: "'Bebas Neue', sans-serif",
                }}
              >
                {player.username.charAt(0).toUpperCase()}
              </div>

              {/* Player info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-bold text-base md:text-lg truncate"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {player.username}
                  </span>
                  {isCurrentPlayer && (
                    <span className="px-2 py-0.5 text-xs rounded bg-[#00d4ff]/20 text-[#00d4ff] shrink-0">
                      YOU
                    </span>
                  )}
                </div>
                <div className="text-white/50 text-xs md:text-sm" style={{ fontFamily: "'Russo One', sans-serif" }}>
                  {player.gamesPlayed} games played
                </div>
              </div>

              {/* Stats */}
              <div className="text-right shrink-0">
                <div
                  className="font-bold text-lg md:text-xl"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    color: "#ffd700",
                  }}
                >
                  {player.wins}W
                </div>
                <div className="text-white/50 text-xs" style={{ fontFamily: "'Russo One', sans-serif" }}>
                  {player.totalPoints} pts
                </div>
              </div>

              {/* Hot streak indicator */}
              {player.hotStreak >= 3 && (
                <div
                  className="absolute -right-1 -top-1 px-2 py-0.5 rounded text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, #ff6b00 0%, #ff3366 100%)",
                    fontFamily: "'Russo One', sans-serif",
                  }}
                >
                  🔥 {player.hotStreak}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center text-white/50 py-12" style={{ fontFamily: "'Russo One', sans-serif" }}>
          No players yet. Be the first!
        </div>
      )}
    </div>
  );
}
