import { SITE } from "@config";
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
      authorTitle: z.string().optional(),
      authorBio: z.string().optional(),
      authorImage: z.string().optional(),
      illustrator: z.string().optional(),
      copyeditor: z.string().optional(),
      pubDatetime: z
        .union([z.date(), z.string()])
        .optional()
        .transform(val => {
          if (!val) return new Date();
          const date = new Date(val);
          return isNaN(date.getTime()) ? new Date() : date;
        })
        .default(() => new Date()),
      modDatetime: z
        .union([z.date(), z.string()])
        .optional()
        .transform(val => {
          if (!val) return null;
          const date = new Date(val);
          return isNaN(date.getTime()) ? null : date;
        })
        .nullable(),
      title: z
        .string()
        .optional()
        .transform(val => val || "Untitled"),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image()
        .refine(img => img.width >= 1200 && img.height >= 630, {
          message: "OpenGraph image must be at least 1200 X 630 pixels!",
        })
        .or(z.string())
        .optional(),
      description: z
        .string()
        .optional()
        .transform(val => val || "No description"),
      locale: z.string().optional(),
      canonicalURL: z.string().optional(),
    }),
});

// Broadcast desk videos (src/content/videos/*.md) — shown on the /videos page
const videos = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    url: z.string(), // YouTube / Facebook link, or /path/to/file.mp4
    pubDatetime: z.coerce.date(),
    author: z.string().optional(),
    description: z.string().optional(),
    thumbnail: z.string().optional(), // optional image URL/path (YouTube gets one automatically)
    show: z.string().optional(), // programme / series name, e.g. "Newsroom Live"
    live: z.boolean().optional(), // red LIVE badge, moved to the front
    featured: z.boolean().optional(), // no longer used; kept so older entries still validate
    draft: z.boolean().optional(),
  }),
});

export const collections = { blog, videos };
