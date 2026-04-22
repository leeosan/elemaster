"use client"
import { useRouter } from "next/navigation"

export default function SilgiPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm">← 뒤로</button>
          <h1 className="text-lg font-bold text-gray-800">🔧 실기 시뮬레이터</h1>
          <span className="text-xs text-gray-500">전기기능장 공개문제 1번 - 주회로</span>
        </div>
      </div>
      <iframe 
        src="/silgi/simulator1.html"
        className="w-full border-0"
        style={{ height: "calc(100vh - 60px)" }}
        title="전기기능장 주회로 시뮬레이터"
      />
    </div>
  )
}