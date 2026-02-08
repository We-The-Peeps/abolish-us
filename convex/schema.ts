import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  products: defineTable({
    title: v.string(),
    imageId: v.string(),
    price: v.number(),
  }),
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),
  presence: defineTable({
    sessionId: v.string(),
    lat: v.number(),
    lng: v.number(),
    isInternational: v.boolean(),
    lastSeen: v.number(),
  })
    .index("sessionId", ["sessionId"])
    .index("lastSeen", ["lastSeen"]),
})
