import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const GAME_DURATION = 60; // 60 seconds per game

export const findOrCreateGame = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already in a game
    const existingAsPlayer1 = await ctx.db
      .query("games")
      .withIndex("by_player1", (q) => q.eq("player1Id", args.playerId))
      .filter((q) => q.neq(q.field("status"), "finished"))
      .first();

    if (existingAsPlayer1) return existingAsPlayer1._id;

    // Look for a waiting game to join
    const waitingGame = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .filter((q) => q.neq(q.field("player1Id"), args.playerId))
      .first();

    if (waitingGame) {
      // Join existing game
      await ctx.db.patch(waitingGame._id, {
        player2Id: args.playerId,
        status: "playing",
        startedAt: Date.now(),
      });
      return waitingGame._id;
    }

    // Create new game
    const gameId = await ctx.db.insert("games", {
      player1Id: args.playerId,
      player1Score: 0,
      player2Score: 0,
      status: "waiting",
      timeLeft: GAME_DURATION,
      createdAt: Date.now(),
    });

    return gameId;
  },
});

export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    // Get player details
    const player1 = await ctx.db.get(game.player1Id);
    const player2 = game.player2Id ? await ctx.db.get(game.player2Id) : null;

    return {
      ...game,
      player1,
      player2,
    };
  },
});

export const getActiveGame = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    // Check as player 1
    const asPlayer1 = await ctx.db
      .query("games")
      .withIndex("by_player1", (q) => q.eq("player1Id", args.playerId))
      .filter((q) => q.neq(q.field("status"), "finished"))
      .first();

    if (asPlayer1) {
      const player1 = await ctx.db.get(asPlayer1.player1Id);
      const player2 = asPlayer1.player2Id ? await ctx.db.get(asPlayer1.player2Id) : null;
      return { ...asPlayer1, player1, player2 };
    }

    // Check as player 2 in all non-finished games
    const allActiveGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "playing"))
      .collect();

    for (const game of allActiveGames) {
      if (game.player2Id === args.playerId) {
        const player1 = await ctx.db.get(game.player1Id);
        const player2 = await ctx.db.get(args.playerId);
        return { ...game, player1, player2 };
      }
    }

    return null;
  },
});

export const scorePoint = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    points: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game || game.status !== "playing") throw new Error("Game not active");

    const isPlayer1 = game.player1Id === args.playerId;
    const isPlayer2 = game.player2Id === args.playerId;

    if (!isPlayer1 && !isPlayer2) throw new Error("Not in this game");

    // Update score
    if (isPlayer1) {
      await ctx.db.patch(args.gameId, {
        player1Score: game.player1Score + args.points,
      });
    } else {
      await ctx.db.patch(args.gameId, {
        player2Score: game.player2Score + args.points,
      });
    }

    // Record event
    await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      playerId: args.playerId,
      eventType: "score",
      points: args.points,
      timestamp: Date.now(),
    });
  },
});

export const updateGameTime = mutation({
  args: {
    gameId: v.id("games"),
    timeLeft: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.status !== "playing") return;

    await ctx.db.patch(args.gameId, { timeLeft: args.timeLeft });
  },
});

export const endGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.status === "finished") return;

    const winnerId =
      game.player1Score > game.player2Score
        ? game.player1Id
        : game.player2Score > game.player1Score
        ? game.player2Id
        : undefined; // tie

    await ctx.db.patch(args.gameId, {
      status: "finished",
      winnerId,
      finishedAt: Date.now(),
    });

    // Update player stats
    const player1 = await ctx.db.get(game.player1Id);
    if (player1) {
      const won = winnerId === game.player1Id;
      const newStreak = won ? player1.hotStreak + 1 : 0;
      await ctx.db.patch(game.player1Id, {
        wins: player1.wins + (won ? 1 : 0),
        losses: player1.losses + (won ? 0 : winnerId ? 1 : 0),
        totalPoints: player1.totalPoints + game.player1Score,
        hotStreak: newStreak,
        bestStreak: Math.max(player1.bestStreak, newStreak),
        gamesPlayed: player1.gamesPlayed + 1,
      });
    }

    if (game.player2Id) {
      const player2 = await ctx.db.get(game.player2Id);
      if (player2) {
        const won = winnerId === game.player2Id;
        const newStreak = won ? player2.hotStreak + 1 : 0;
        await ctx.db.patch(game.player2Id, {
          wins: player2.wins + (won ? 1 : 0),
          losses: player2.losses + (won ? 0 : winnerId ? 1 : 0),
          totalPoints: player2.totalPoints + game.player2Score,
          hotStreak: newStreak,
          bestStreak: Math.max(player2.bestStreak, newStreak),
          gamesPlayed: player2.gamesPlayed + 1,
        });
      }
    }
  },
});

export const leaveGame = mutation({
  args: { gameId: v.id("games"), playerId: v.id("players") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return;

    if (game.status === "waiting" && game.player1Id === args.playerId) {
      // Delete the waiting game
      await ctx.db.delete(args.gameId);
    } else if (game.status === "playing") {
      // Forfeit - other player wins
      const winnerId =
        game.player1Id === args.playerId ? game.player2Id : game.player1Id;

      await ctx.db.patch(args.gameId, {
        status: "finished",
        winnerId,
        finishedAt: Date.now(),
      });
    }
  },
});

export const getRecentGames = query({
  args: { playerId: v.id("players"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get games where player was player1
    const asPlayer1 = await ctx.db
      .query("games")
      .withIndex("by_player1", (q) => q.eq("player1Id", args.playerId))
      .filter((q) => q.eq(q.field("status"), "finished"))
      .order("desc")
      .take(limit);

    // Get all finished games and filter for player2
    const allFinished = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "finished"))
      .order("desc")
      .take(100);

    const asPlayer2 = allFinished.filter((g) => g.player2Id === args.playerId).slice(0, limit);

    // Combine and sort
    const allGames = [...asPlayer1, ...asPlayer2]
      .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
      .slice(0, limit);

    // Enrich with player data
    const enriched = await Promise.all(
      allGames.map(async (game) => {
        const player1 = await ctx.db.get(game.player1Id);
        const player2 = game.player2Id ? await ctx.db.get(game.player2Id) : null;
        return { ...game, player1, player2 };
      })
    );

    return enriched;
  },
});

export const getGameEvents = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gameEvents")
      .withIndex("by_game_time", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .take(20);
  },
});
