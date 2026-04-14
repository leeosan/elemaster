"use client"
import { useRouter } from "next/navigation"

const topics = [
  {
    title: "복소수 계산 (임피던스)",
    icon: "⚡",
    color: "blue",
    steps: [
      "HOME 버튼 → Complex 앱 선택",
      "예: (6+j8) 입력시 → 6+8i 입력",
      "허수 j 대신 i 사용 (ENG 버튼)",
      "극좌표 변환: OPTN → r∠θ"
    ],
    example: "6+8i → |Z|=10, θ=53.13°"
  },
  {
    title: "삼각함수",
    icon: "📐",
    color: "green",
    steps: [
      "각도 모드 확인: DEG 모드 사용",
      "sin/cos/tan 버튼 직접 입력",
      "역삼각함수: SHIFT + sin/cos/tan",
      "예: sin(30) = 0.5"
    ],
    example: "역률각도: cos⁻¹(0.8) = 36.87°"
  },
  {
    title: "제곱근/거듭제곱",
    icon: "🔢",
    color: "purple",
    steps: [
      "√ : SHIFT + x² 버튼",
      "거듭제곱: ^ 버튼 사용",
      "예: √(3²+4²) = 5",
      "10의 거듭제곱: EXP 버튼"
    ],
    example: "√(R²+X²) 임피던스 크기 계산"
  },
  {
    title: "연립방정식",
    icon: "📊",
    color: "orange",
    steps: [
      "HOME → Equation/Func 앱",
      "SimEq 선택 (연립방정식)",
      "미지수 개수 선택 후 계수 입력",
      "= 누르면 자동 계산"
    ],
    example: "키르히호프 법칙 회로 계산"
  },
  {
    title: "극좌표 ↔ 직교좌표",
    icon: "🔄",
    color: "red",
    steps: [
      "OPTN 버튼 → 변환 메뉴",
      "Pol(x,y): 직교→극좌표",
      "Rec(r,θ): 극→직교좌표",
      "결과: r, θ 또는 x, y 표시"
    ],
    example: "Pol(3,4) → r=5, θ=53.13°"
  },
  {
    title: "메모리 활용",
    icon: "💾",
    color: "teal",
    steps: [
      "STO 버튼으로 변수 저장",
      "A~F, x, y, z 변수 사용 가능",
      "저장: 값 입력 후 STO → 변수명",
      "호출: ALPHA → 변수명"
    ],
    example: "중간 계산값 저장 후 재활용"
  }
]

const colorMap: any = {
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  green: "bg-green-50 border-green-200 text-green-700",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
  orange: "bg-orange-50 border-orange-200 text-orange-700",
  red: "bg-red-50 border-red-200 text-red-700",
  teal: "bg-teal-50 border-teal-200 text-teal-700"
}

export default function CalculatorPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-gray-500 text-sm hover:text-gray-700">← 뒤로</button>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">🔢 공학용 계산기 사용법</h1>
          <p className="text-gray-500 text-sm mt-1">CASIO FX-991CW 기준 · 전기 자격증 시험 허용 기종</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🧮</span>
            <div>
              <p className="font-bold text-gray-800">CASIO FX-991CW</p>
              <p className="text-sm text-gray-500">국가기술자격시험 허용 · 552가지 함수</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href="https://www.youtube.com/results?search_query=fx-991CW+전기기사+사용법" target="_blank" rel="noopener noreferrer"
              className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-full hover:bg-red-600">
              🎬 유튜브 강의 보기
            </a>
            <a href="https://support.casio.com/global/ko/calc/manual/fx-570CW_991CW_ko/" target="_blank" rel="noopener noreferrer"
              className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-full hover:bg-blue-600">
              📖 공식 매뉴얼
            </a>
            <a href="https://prod.danawa.com/info/?pcode=18963035" target="_blank" rel="noopener noreferrer"
              className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-full hover:bg-green-600">
              🛒 구매하기
            </a>
          </div>
        </div>

        <h2 className="font-bold text-gray-700 mb-3">⚡ 전기 시험 핵심 기능</h2>
        <div className="grid gap-4">
          {topics.map((t) => (
            <div key={t.title} className={`rounded-xl border p-4 ${colorMap[t.color]}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{t.icon}</span>
                <h3 className="font-bold">{t.title}</h3>
              </div>
              <ol className="text-sm space-y-1 mb-3">
                {t.steps.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-bold">{i+1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <div className="bg-white bg-opacity-60 rounded-lg px-3 py-2 text-xs font-mono">
                💡 {t.example}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="font-bold text-yellow-800 mb-2">⚠️ 시험장 주의사항</p>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 시험 전 계산기 초기화 필수 (SHIFT → 9 → 3)</li>
            <li>• 각도 단위 DEG 모드 확인</li>
            <li>• 복소수 계산 시 j 대신 i 사용</li>
            <li>• 메모리 초기화: SHIFT → 9 → 1</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
