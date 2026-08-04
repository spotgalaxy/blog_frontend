import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    // 博客文章：content/blog/*.md
    blog: defineCollection({
      type: 'page',
      source: 'blog/*.md',
      schema: z.object({
        date: z.string(),
        summary: z.string(),
        tags: z.array(z.string()).default([]),
        draft: z.boolean().default(false)
      })
    }),
    // 作品：content/projects/*.md
    projects: defineCollection({
      type: 'page',
      source: 'projects/*.md',
      schema: z.object({
        name: z.string(),
        role: z.string(),
        year: z.number(),
        summary: z.string(),
        cover: z.string().optional(),
        coverDark: z.string().optional(),
        letter: z.string().default('P'),
        link: z.string().optional(),
        featured: z.boolean().default(false),
        order: z.number().default(99)
      })
    })
  }
})
