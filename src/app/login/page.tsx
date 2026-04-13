"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPw, setShowPw] = useState(false)

  async function handleLogin() {
    if (!email || !password) { setError("이메일과 비밀번호를 입력해주세요"); return }
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError("이메일 또는 비밀번호가 올바르지 않습니다") }
    else { router.push("/") }
    setLoading(false)
  }

  async function handleKakaoLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/`,
        scopes: "profile_nickname profile_image",
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">⚡ EleMaster</h1>
          <p className="text-gray-500 text-sm mt-1">전기 자격증 합격의 지름길</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg mb-4">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="이메일 입력"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">비밀번호</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="비밀번호 입력"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 pr-10"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2 text-gray-400 text-sm">
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">또는</span></div>
          </div>

          <button onClick={handleKakaoLogin} className="w-full py-3 bg-yellow-400 text-gray-800 rounded-lg font-semibold hover:bg-yellow-500 flex items-center justify-center gap-2">
            <span className="text-lg">💬</span> 카카오로 로그인
          </button>
        </div>

        <div className="mt-6 text-center space-y-2">
          <Link href="/reset-password" className="block text-sm text-gray-400 hover:text-gray-600">비밀번호 찾기</Link>
          <p className="text-sm text-gray-500">
            계정이 없으신가요? <Link href="/signup" className="text-blue-600 font-semibold hover:underline">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  )
}