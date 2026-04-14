import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          ⚡ EleMaster
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          전기 자격증 합격의 지름길
        </p>
        <p className="text-sm text-gray-400 mb-8">
          전기기능장 · 전기기사 · 전기기능사 · 소방기사
        </p>
        <div className="grid grid-cols-2 gap-4 mt-12">
          <Link href="/cbt/past?exam=1" className="bg-white rounded-xl p-6 shadow hover:shadow-md hover:border-blue-300 border border-transparent transition-all">
            <div className="text-3xl mb-2">📝</div>
            <h2 className="font-bold text-lg">필기 CBT</h2>
            <p className="text-gray-500 text-sm mt-1">모의고사 / 과년도 문제</p>
          </Link>
          <Link href="/silgi" className="bg-white rounded-xl p-6 shadow hover:shadow-md hover:border-blue-300 border border-transparent transition-all">
            <div className="text-3xl mb-2">🔧</div>
            <h2 className="font-bold text-lg">실기</h2>
            <p className="text-gray-500 text-sm mt-1">필답형 / PLC 작업형</p>
          </Link>
          <Link href="/mypage" className="bg-white rounded-xl p-6 shadow hover:shadow-md hover:border-blue-300 border border-transparent transition-all">
            <div className="text-3xl mb-2">📊</div>
            <h2 className="font-bold text-lg">나의 학습</h2>
            <p className="text-gray-500 text-sm mt-1">오답노트 / 학습통계</p>
          </Link>
          <Link href="/exam-info" className="bg-white rounded-xl p-6 shadow hover:shadow-md hover:border-blue-300 border border-transparent transition-all">
            <div className="text-3xl mb-2">ℹ️</div>
            <h2 className="font-bold text-lg">시험정보</h2>
            <p className="text-gray-500 text-sm mt-1">일정 / 합격률 / 준비물</p>
          </Link>
        </div>
      </div>
    </main>
  )
}
