import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import Header from "./components/Header"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EleMaster - 전기 자격증 합격의 지름길",
  description: "전기기능장, 전기기사, 전기기능사, 소방기사 CBT 모의고사 및 과년도 문제",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={geist.className}>
        <Header />
        {children}
      </body>
    </html>
  )
}