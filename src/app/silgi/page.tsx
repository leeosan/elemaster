"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

export default function SilgiPage() {
  const router = useRouter()
  const [authChecking, setAuthChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/login?redirect=/silgi")
        return
      }
      setUserId(user.id)
      setAuthorized(true)
      setAuthChecking(false)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()

    const loadAndSend = async () => {
      const { data } = await supabase
        .from("simulator_progress")
        .select("phase, wire_data, progress_pct")
        .eq("user_id", userId)
        .eq("simulator_id", "phase1_main")
      if (!data) return
      const iframe = document.getElementById("sim-iframe") as HTMLIFrameElement | null
      if (!iframe?.contentWindow) return
      iframe.contentWindow.postMessage({ type: "LOAD_PROGRESS", payload: data }, "*")
    }

    const handler = async (ev: MessageEvent) => {
      if (!ev.data || typeof ev.data !== "object") return
      if (ev.data.type === "SAVE_PROGRESS") {
        const { phase, wire_data, progress_pct } = ev.data.payload
        const { error: upsertError } = await supabase.from("simulator_progress").upsert({
          user_id: userId,
          simulator_id: "phase1_main",
          phase: String(phase),
          wire_data,
          progress_pct,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id,simulator_id,phase" })
        if (upsertError) console.error("[SAVE_PROGRESS] error:", upsertError)
      }
      if (ev.data.type === "IFRAME_READY") {
        loadAndSend()
      }
    }

    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [userId])

  if (authChecking) return (<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">로그인 확인 중...</p></div>)
  if (!authorized) return null
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm">← 뒤로</button>
          <h1 className="text-lg font-bold text-gray-800">🔧 실기 시뮬레이터</h1>
          <span className="text-xs text-gray-500">전기기능장 공개문제 1번 - 주회로</span>
        </div>
      </div>
      <iframe id="sim-iframe" 
        src="/silgi/simulator1.html"
        className="w-full border-0"
        style={{ height: "calc(100vh - 60px)" }}
        title="전기기능장 주회로 시뮬레이터"
      />
    </div>
  )
}