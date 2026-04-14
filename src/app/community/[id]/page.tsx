"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter, useParams } from "next/navigation"

export default function CommunityDetailPage() {
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [user, setUser] = useState<any>(null)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [commenting, setCommenting] = useState(false)
  const router = useRouter()
  const params = useParams()
  const postId = params.id

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // 게시글 불러오기 + 조회수 증가
      const { data: postData } = await supabase.from("posts").select("*").eq("id", postId).single()
      setPost(postData)
      await supabase.from("posts").update({ view_count: (postData?.view_count || 0) + 1 }).eq("id", postId)

      // 댓글 불러오기
      const { data: commentData } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at")
      setComments(commentData || [])

      // 좋아요 여부
      if (user) {
        const { data: likeData } = await supabase.from("post_likes").select("id").eq("user_id", user.id).eq("post_id", postId).single()
        setLiked(!!likeData)
      }

      setLoading(false)
    }
    init()
  }, [postId])

  const toggleLike = async () => {
    if (!user) return
    const supabase = createClient()
    if (liked) {
      await supabase.from("post_likes").delete().eq("user_id", user.id).eq("post_id", postId)
      setLiked(false)
      setPost((prev: any) => ({ ...prev, like_count: prev.like_count - 1 }))
    } else {
      await supabase.from("post_likes").insert({ user_id: user.id, post_id: postId })
      setLiked(true)
      setPost((prev: any) => ({ ...prev, like_count: prev.like_count + 1 }))
    }
  }

  const submitComment = async () => {
    if (!user || !newComment.trim()) return
    setCommenting(true)
    const supabase = createClient()
    const { data } = await supabase.from("comments").insert({
      user_id: user.id,
      post_id: postId,
      content: newComment.trim()
    }).select().single()
    if (data) {
      setComments(prev => [...prev, data])
      setNewComment("")
    }
    setCommenting(false)
  }

  const deletePost = async () => {
    if (!confirm("게시글을 삭제하시겠습니까?")) return
    const supabase = createClient()
    await supabase.from("posts").delete().eq("id", postId)
    router.push("/community")
  }

  const deleteComment = async (commentId: number) => {
    const supabase = createClient()
    await supabase.from("comments").delete().eq("id", commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">불러오는 중...</p></div>
  if (!post) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">게시글을 찾을 수 없습니다</p></div>

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push("/community")} className="text-gray-500 text-sm mb-4 hover:text-gray-700">← 목록으로</button>

        {/* 게시글 */}
        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
              ${post.category === "free" ? "bg-blue-100 text-blue-600" : ""}
              ${post.category === "qna" ? "bg-yellow-100 text-yellow-700" : ""}
              ${post.category === "pass" ? "bg-green-100 text-green-700" : ""}`}>
              {post.category === "free" ? "💬 자유" : post.category === "qna" ? "❓ 질문/답변" : "🏆 합격후기"}
            </span>
            {user?.id === post.user_id && (
              <button onClick={deletePost} className="text-xs text-red-400 hover:text-red-600">삭제</button>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">{post.title}</h1>
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
            <span>수험생 {post.user_id.slice(0, 6)}</span>
            <span>{formatDate(post.created_at)}</span>
            <span>👀 {post.view_count}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {/* 좋아요 */}
          <div className="mt-6 flex justify-center">
            <button onClick={toggleLike} disabled={!user}
              className={`flex items-center gap-2 px-6 py-2 rounded-full border-2 text-sm font-semibold transition-all
                ${liked ? "bg-red-50 border-red-400 text-red-500" : "bg-white border-gray-200 text-gray-500 hover:border-red-300"}`}>
              {liked ? "❤️" : "🤍"} {post.like_count}
            </button>
          </div>
        </div>

        {/* 댓글 */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-bold text-gray-800">💬 댓글 {comments.length}개</h2>
          </div>

          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">첫 댓글을 남겨보세요!</div>
          ) : (
            <div className="divide-y">
              {comments.map(c => (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-600">수험생 {c.user_id.slice(0, 6)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                      {user?.id === c.user_id && (
                        <button onClick={() => deleteComment(c.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* 댓글 입력 */}
          {user ? (
            <div className="px-5 py-4 border-t bg-gray-50">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-400 mb-2"
              />
              <button onClick={submitComment} disabled={commenting || !newComment.trim()}
                className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40">
                {commenting ? "등록 중..." : "댓글 등록"}
              </button>
            </div>
          ) : (
            <div className="px-5 py-4 border-t text-center text-sm text-gray-400">
              댓글을 작성하려면 <button onClick={() => router.push("/login")} className="text-blue-600 hover:underline">로그인</button>이 필요합니다
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
