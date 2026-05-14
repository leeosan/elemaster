"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const ADMIN_EMAIL = "jaetech01@gmail.com"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/")
  }

  const isAdmin = user?.email === ADMIN_EMAIL

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          ⚡ EleMaster
        </Link>

        {/* 데스크탑 메뉴 */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/cbt/past?exam=1" className="hover:text-blue-600">필기 CBT</Link>
          <Link href="/silgi" className="hover:text-blue-600">실기</Link>
          <Link href="/mypage" className="hover:text-blue-600">나의 학습</Link>
          <Link href="/exam-info" className="hover:text-blue-600">시험정보</Link>
          <Link href="/calculator" className="hover:text-blue-600">공학용계산기</Link>
          <Link href="/tools/karnaugh" className="hover:text-blue-600">도구</Link>
          <Link href="/community" className="hover:text-blue-600">커뮤니티</Link>
          {isAdmin && (
            <Link href="/admin" className="hover:text-red-600 text-red-500 font-bold">🛠 관리자</Link>
          )}
        </nav>

        {/* 로그인/로그아웃 버튼 */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {user.user_metadata?.name || user.email?.split("@")[0]}님
              </span>
              <button
                onClick={handleLogout}
                className="text-sm bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-blue-600">로그인</Link>
              <Link href="/signup" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                회원가입
              </Link>
            </>
          )}
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
          <Link href="/cbt/past?exam=1" onClick={() => setMenuOpen(false)}>📝 필기 CBT</Link>
          <Link href="/silgi" onClick={() => setMenuOpen(false)}>🔧 실기</Link>
          <Link href="/mypage" onClick={() => setMenuOpen(false)}>📊 나의 학습</Link>
          <Link href="/exam-info" onClick={() => setMenuOpen(false)}>ℹ️ 시험정보</Link>
          <Link href="/calculator" onClick={() => setMenuOpen(false)}>📱 공학용계산기</Link>
          <Link href="/tools/karnaugh" onClick={() => setMenuOpen(false)}>🧮 도구 (카르노맵)</Link>
          <Link href="/community" onClick={() => setMenuOpen(false)}>💬 커뮤니티</Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-red-500 font-bold">🛠 관리자</Link>
          )}
          <hr />
          {user ? (
            <>
              <span className="text-gray-600">{user.user_metadata?.name || user.email?.split("@")[0]}님</span>
              <button onClick={handleLogout} className="text-left text-red-500">로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)}>로그인</Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-center">회원가입</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
