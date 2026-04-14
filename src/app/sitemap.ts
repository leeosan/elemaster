import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://elemaster.kr", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: "https://elemaster.kr/cbt/past?exam=1", lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: "https://elemaster.kr/exam-info", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://elemaster.kr/calculator", lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: "https://elemaster.kr/silgi", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ]
}

