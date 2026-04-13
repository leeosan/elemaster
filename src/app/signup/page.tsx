"use client"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError("모든 항목을 입력해주세요.")
      return
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상 입력해주세요.")
      return
    }
    setLoading(true)
    setError("")

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        name,
        email,
      })
    }

    router.push("/")
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
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">⚡ EleMaster</h1>
          <p className="text-gray-500 text-sm mt-1">회원가입</p>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-3 rounded-lg">{error}</p>}

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={e => setName(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-sm"
          />
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-sm"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-16 focus:outline-none focus:border-blue-500 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              {showPassword ? "숨기기" : "보기"}
            </button>
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "처리 중..." : "회원가입"}
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">또는</span></div>
          </div>

          <button onClick={handleKakaoLogin} className="w-full py-3 bg-yellow-400 text-gray-800 rounded-lg font-semibold hover:bg-yellow-500 flex items-center justify-center gap-2">
            <span className="text-lg">💬</span> 카카오로 시작하기
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          이미 회원이신가요?{" "}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  )
}