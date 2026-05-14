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
            ⚠️ 실기 학습 자료(회로도, 작업 영상, 결선 가이드)는 순차적으로 업데이트됩니다.
            구체적인 학습 자료가 필요하면 커뮤니티에 요청해주세요.
          </p>
        </div>
      </div>
    </div>
  )
}