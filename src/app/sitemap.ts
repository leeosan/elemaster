import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://elemaster.vercel.app", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: "https://elemaster.vercel.app/cbt/past?exam=1", lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: "https://elemaster.vercel.app/exam-info", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://elemaster.vercel.app/calculator", lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: "https://elemaster.vercel.app/silgi", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ]
}
