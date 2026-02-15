import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const AVATAR_COLORS = [
  "#ff6b00", "#00d4ff", "#ffd700", "#ff3366", "#00ff88",
  "#9933ff", "#ff9500", "#00ccff", "#ff0066", "#33ff99"
];

export const getOrCreatePlayer = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if player already exists
    const existing = await ctx.db
      .query("players")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) return existing._id;

    // Get user info for username
    const user = await ctx.db.get(userId);
    const email = (user as unknown as { email?: string })?.email;
    const username = email ? email.split("@")[0] : `Player${Math.floor(Math.random() * 10000)}`;

    // Create new player
    const playerId = await ctx.db.insert("players", {
      userId,
      username,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      wins: 0,
      losses: 0,
      totalPoints: 0,
      hotStreak: 0,
      bestStreak: 0,
      gamesPlayed: 0,
      createdAt: Date.now(),
    });

    return playerId;
  },
});

export const getCurrentPlayer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("players")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const updateUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const player = await ctx.db
      .query("players")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!player) throw new Error("Player not found");

    await ctx.db.patch(player._id, { username: args.username });
  },
});

export const updateAvatarColor = mutation({
  args: { color: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const player = await ctx.db
      .query("players")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!player) throw new Error("Player not found");

    await ctx.db.patch(player._id, { avatarColor: args.color });
  },
});

export const getLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const players = await ctx.db
      .query("players")
      .withIndex("by_wins")
      .order("desc")
      .take(100);

    // Sort by wins, then by total points
    return players
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.totalPoints - a.totalPoints;
      })
      .slice(0, limit);
  },
});

export const getPlayerById = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.playerId);
  },
});
