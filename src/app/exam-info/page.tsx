"use client"
import { useRouter } from "next/navigation"
export default function ExamInfoPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-5xl mb-4">ℹ️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">시험정보</h1>
        <p className="text-gray-500 mb-6">준비 중입니다</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">← 뒤로</button>
      </div>
    </div>
  )
}
