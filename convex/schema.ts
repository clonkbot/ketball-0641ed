import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Player profiles with stats
  players: defineTable({
    userId: v.id("users"),
    username: v.string(),
    avatarColor: v.string(),
    wins: v.number(),
    losses: v.number(),
    totalPoints: v.number(),
    hotStreak: v.number(), // current win streak
    bestStreak: v.number(),
    gamesPlayed: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_wins", ["wins"])
    .index("by_total_points", ["totalPoints"]),

  // Active game rooms
  games: defineTable({
    player1Id: v.id("players"),
    player2Id: v.optional(v.id("players")),
    player1Score: v.number(),
    player2Score: v.number(),
    status: v.string(), // "waiting", "playing", "finished"
    winnerId: v.optional(v.id("players")),
    timeLeft: v.number(), // seconds remaining
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_player1", ["player1Id"])
    .index("by_created", ["createdAt"]),

  // Game events for real-time updates
  gameEvents: defineTable({
    gameId: v.id("games"),
    playerId: v.id("players"),
    eventType: v.string(), // "score", "block", "steal", "hotStreak"
    points: v.optional(v.number()),
    timestamp: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_game_time", ["gameId", "timestamp"]),

  // Matchmaking queue
  matchQueue: defineTable({
    playerId: v.id("players"),
    joinedAt: v.number(),
  })
    .index("by_player", ["playerId"])
    .index("by_joined", ["joinedAt"]),
});
