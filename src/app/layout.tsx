import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import Header from "./components/Header"
const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EleMaster - 전기 자격증 합격의 지름길",
  description: "전기기능장, 전기기사, 전기기능사 CBT 모의고사 및 과년도 기출문제 무료 제공. 출제빈도 분석, 해설, 풀이 공유까지!",
  keywords: ["전기기능장", "전기기사", "전기기능사", "CBT", "기출문제", "모의고사", "필기", "과년도", "전기자격증"],
  authors: [{ name: "EleMaster" }],
  creator: "EleMaster",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://elemaster.kr",
    siteName: "EleMaster",
    title: "EleMaster - 전기 자격증 합격의 지름길",
    description: "전기기능장, 전기기사, 전기기능사 CBT 모의고사 및 과년도 기출문제 무료 제공",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EleMaster - 전기 자격증 CBT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EleMaster - 전기 자격증 합격의 지름길",
    description: "전기기능장, 전기기사, 전기기능사 CBT 모의고사 및 과년도 기출문제 무료 제공",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: "46UUNj9fKGMb85ADvnrR4RqBkQmIeJ2x6Z969zCfM88",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="canonical" href="https://elemaster.kr" />
      </head>
      <body className={geist.className}>
        <Header />
        {children}
      </body>
    </html>
  )
}


