import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const heartbeat = mutation({
  args: {
    sessionId: v.string(),
    lat: v.number(),
    lng: v.number(),
    isInternational: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('presence')
      .withIndex('sessionId', (q) => q.eq('sessionId', args.sessionId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        lat: args.lat,
        lng: args.lng,
        isInternational: args.isInternational,
        lastSeen: Date.now(),
      })
    } else {
      await ctx.db.insert('presence', {
        sessionId: args.sessionId,
        lat: args.lat,
        lng: args.lng,
        isInternational: args.isInternational,
        lastSeen: Date.now(),
      })
    }

    // Clean up stale entries older than 5 minutes
    const staleTime = Date.now() - 5 * 60 * 1000
    const staleEntries = await ctx.db
      .query('presence')
      .withIndex('lastSeen', (q) => q.lt('lastSeen', staleTime))
      .take(10)

    for (const entry of staleEntries) {
      await ctx.db.delete(entry._id)
    }
  },
})

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 2 * 60 * 1000
    return await ctx.db
      .query('presence')
      .withIndex('lastSeen', (q) => q.gte('lastSeen', cutoff))
      .collect()
  },
})
