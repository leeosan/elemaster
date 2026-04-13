"use client"
import Link from "next/link"
import { useState } from "react"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          ⚡ EleMaster
        </Link>

        {/* 데스크탑 메뉴 */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/cbt" className="hover:text-blue-600">필기 CBT</Link>
          <Link href="/practical" className="hover:text-blue-600">실기</Link>
          <Link href="/mypage" className="hover:text-blue-600">나의 학습</Link>
          <Link href="/info" className="hover:text-blue-600">시험정보</Link>
          <Link href="/calculator" className="hover:text-blue-600">공학용계산기</Link>
        </nav>

        {/* 로그인 버튼 */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/login" className="text-sm text-gray-600 hover:text-blue-600">로그인</Link>
          <Link href="/signup" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            회원가입
          </Link>
        </div>

        {/* 모바일 햄버거 */}
        <button
          className="md:hidden text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t px-4 py-3 flex flex-col gap-3 text-sm font-medium text-gray-600">
          <Link href="/cbt" onClick={() => setMenuOpen(false)}>📝 필기 CBT</Link>
          <Link href="/practical" onClick={() => setMenuOpen(false)}>🔧 실기</Link>
          <Link href="/mypage" onClick={() => setMenuOpen(false)}>📊 나의 학습</Link>
          <Link href="/info" onClick={() => setMenuOpen(false)}>ℹ️ 시험정보</Link>
          <Link href="/calculator" onClick={() => setMenuOpen(false)}>📱 공학용계산기</Link>
          <hr />
          <Link href="/login" onClick={() => setMenuOpen(false)}>로그인</Link>
          <Link href="/signup" onClick={() => setMenuOpen(false)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-center">회원가입</Link>
        </div>
      )}
    </header>
  )
}