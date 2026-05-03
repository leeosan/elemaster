import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://elemaster.kr'
  const now = new Date()
  
  return [
    { url: `${base}`,                priority: 1.0, lastModified: now, changeFrequency: 'weekly' },
    { url: `${base}/cbt`,            priority: 0.9, lastModified: now, changeFrequency: 'weekly' },
    { url: `${base}/cbt/past`,       priority: 0.9, lastModified: now, changeFrequency: 'weekly' },
    { url: `${base}/cbt/popular`,    priority: 0.8, lastModified: now, changeFrequency: 'weekly' },
    { url: `${base}/silgi`,          priority: 0.9, lastModified: now, changeFrequency: 'monthly' },
    { url: `${base}/exam-info`,      priority: 0.7, lastModified: now, changeFrequency: 'monthly' },
    { url: `${base}/calculator`,     priority: 0.7, lastModified: now, changeFrequency: 'monthly' },
    { url: `${base}/tools/karnaugh`, priority: 0.7, lastModified: now, changeFrequency: 'monthly' },
    { url: `${base}/community`,      priority: 0.6, lastModified: now, changeFrequency: 'daily' },
  ]
}