"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const CATEGORIES = [
  { key: "all", label: "전체" },
  { key: "free", label: "💬 자유" },
  { key: "qna", label: "❓ 질문/답변" },
  { key: "pass", label: "🏆 합격후기" },
]

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("all")
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [category])

  const fetchPosts = async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase.from("posts").select("*").order("created_at", { ascending: false })
    if (category !== "all") query = query.eq("category", category)
    const { data } = await query.limit(50)
    setPosts(data || [])
    setLoading(false)
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return "방금 전"
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
    return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })
  }

  const getCategoryLabel = (cat: string) => {
    const found = CATEGORIES.find(c => c.key === cat)
    return found ? found.label : cat
  }

  const getCategoryColor = (cat: string) => {
    if (cat === "free") return "bg-blue-100 text-blue-600"
    if (cat === "qna") return "bg-yellow-100 text-yellow-700"
    if (cat === "pass") return "bg-green-100 text-green-700"
    return "bg-gray-100 text-gray-600"
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">💬 커뮤니티</h1>
          {user && (
            <button
              onClick={() => router.push(`/community/write?category=${category === "all" ? "free" : category}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              ✏️ 글쓰기
            </button>
          )}
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all
                ${category === c.key ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-blue-400"}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* 게시글 목록 */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-400">불러오는 중...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-gray-500 text-sm">첫 번째 글을 작성해보세요!</p>
              {user && (
                <button onClick={() => router.push(`/community/write?category=${category === "all" ? "free" : category}`)} className="mt-4 text-blue-600 text-sm hover:underline">
                  글쓰기 →
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {posts.map(post => (
                <button
                  key={post.id}
                  onClick={() => router.push(`/community/${post.id}`)}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(post.category)}`}>
                          {getCategoryLabel(post.category)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 truncate">{post.title}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{post.content.slice(0, 50)}...</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{formatDate(post.created_at)}</span>
                        <span>👀 {post.view_count}</span>
                        <span>❤️ {post.like_count}</span>
                        <span>💬 {post.comment_count}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {!user && (
          <p className="text-center text-xs text-gray-400 mt-4">
            글을 작성하려면 <button onClick={() => router.push("/login")} className="text-blue-600 hover:underline">로그인</button>이 필요합니다
          </p>
        )}
      </div>
    </div>
  )
}
