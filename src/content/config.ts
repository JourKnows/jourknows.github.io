import { SITE } from "@config";
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
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
      canonicalURL: z.string().optional(),
    }),
});

export const collections = { blog };
