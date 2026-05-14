"use client"
import Link from "next/link"

export default function ElectricianPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">⚙️ 전기기능사</h1>
        <p className="text-gray-500 mb-8">전기기능사 필기 · 실기 학습 안내</p>

        <div className="grid gap-4">
          {/* 필기 CBT (준비중) */}
          <button
            onClick={() => alert("전기기능사 필기 CBT는 준비중입니다.\n빠른 시일 내에 오픈 예정입니다!")}
            className="bg-white rounded-2xl shadow p-6 text-left hover:shadow-md transition cursor-pointer border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-800">📝 필기 CBT</h2>
              <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-1 rounded-full">준비중</span>
            </div>
            <p className="text-sm text-gray-500">전기기능사 필기 시험 CBT 모의고사</p>
          </button>

          {/* 실기 안내 */}
          <Link
            href="/electrician/silgi"
            className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition cursor-pointer border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-800">🔧 실기</h2>
              <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-full">안내</span>
            </div>
            <p className="text-sm text-gray-500">전기기능사 실기 시험 정보 및 학습 자료</p>
          </Link>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-sm text-blue-700">
            💡 전기기능사 콘텐츠는 순차적으로 업데이트됩니다. 학습 진행 중 의견이나 요청사항은 커뮤니티에 남겨주세요.
          </p>
        </div>
      </div>
    </div>
  )
}