"use client"
import Link from "next/link"

export default function ElectricianSilgiPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/electrician" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← 전기기능사로</Link>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">🔧 전기기능사 실기</h1>
        <p className="text-gray-500 mb-8">실기 시험 안내 및 학습 자료</p>

        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">🎬 시뮬레이터 5분 튜토리얼</h2>
            <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full">YouTube</span>
          </div>

          <div className="relative w-full mb-3" style={{ paddingBottom: "56.25%" }}>
            <iframe src="https://www.youtube.com/embed/1Qi6cNonqzk" title="전기 시뮬레이터(CraftsMan) 5분 튜토리얼" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="absolute top-0 left-0 w-full h-full rounded-xl" />
          </div>

          <h3 className="font-semibold text-gray-800 text-sm mb-2">전기 시뮬레이터(CraftsMan) 5분 튜토리얼 안내</h3>
          <p className="text-xs text-gray-500 mb-2">조회수 1,444회 · 2026. 4. 21.</p>

          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            전기기능사 및 승강기기능사를 시뮬레이션 해볼 수 있는 프로그램 <strong>CraftsMan 베타버전</strong>이 출시되었습니다. 영상의 5분 튜토리얼 보시고 플레이해보세요!
          </p>

          <a href="https://github.com/HuichaeStudio/CraftsMan" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition mb-3">💾 CraftsMan 다운로드 (GitHub)</a>

          <div className="flex flex-wrap gap-1 mb-3 mt-3">
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">#전기기능사실기</span>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">#전기기능사</span>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">#craftsman</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            ℹ️ 본 영상은 <strong>희채의 미래교실(정희채)</strong> 유튜브 채널의 허락(승인) 후 게재되었습니다.
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">📋 시험 개요</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• 시험 시간: 5시간</li>
            <li>• 작업 내용: 배전반 결선 작업 (전선 가공, 배선, 결선)</li>
            <li>• 합격 기준: 60점 이상</li>
            <li>• 주요 평가: 회로 구성 정확성, 작업 안전, 작업 시간 준수</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">📚 학습 포인트</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• 단선/연선 가공 기술 (탈피, 압착)</li>
            <li>• 단자대 결선 (압착단자, 링터미널)</li>
            <li>• 전선 색상 규정 (R/S/T/N/접지)</li>
            <li>• 기본 회로: 자기유지, 인터록, 타이머</li>
            <li>• 안전 작업: 전원 차단 확인, 검전</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <p className="text-sm text-yellow-800">
            ⚠️ 실기 학습 자료(회로도, 작업 영상, 결선 가이드)는 순차적으로 업데이트됩니다. 구체적인 학습 자료가 필요하면 커뮤니티에 요청해주세요.
          </p>
        </div>
      </div>
    </div>
  )
}