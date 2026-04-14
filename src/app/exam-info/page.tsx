export default function ExamInfoPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">📋 시험 정보</h1>

        {/* 2026 시험 일정 */}
        <div className="bg-white rounded-2xl shadow p-6 mb-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📅 2026년 전기기능장 시험 일정</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-50 text-blue-700">
                  <th className="px-3 py-2 text-left rounded-l-lg">구분</th>
                  <th className="px-3 py-2 text-center">원서접수</th>
                  <th className="px-3 py-2 text-center">시험일</th>
                  <th className="px-3 py-2 text-center rounded-r-lg">합격발표</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-3 py-3 font-semibold text-gray-700">필기 1회</td>
                  <td className="px-3 py-3 text-center text-gray-600">1.19 ~ 1.22</td>
                  <td className="px-3 py-3 text-center text-gray-600">2.22 ~ 3.10</td>
                  <td className="px-3 py-3 text-center text-gray-600">3.18</td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-gray-700">실기 1회</td>
                  <td className="px-3 py-3 text-center text-gray-600">3.23 ~ 3.26</td>
                  <td className="px-3 py-3 text-center text-gray-600">4.19 ~ 5.9</td>
                  <td className="px-3 py-3 text-center text-gray-600">5.27</td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-gray-700">필기 2회</td>
                  <td className="px-3 py-3 text-center text-gray-600">6.15 ~ 6.18</td>
                  <td className="px-3 py-3 text-center text-gray-600">7.19 ~ 8.4</td>
                  <td className="px-3 py-3 text-center text-gray-600">8.12</td>
                </tr>
                <tr>
                  <td className="px-3 py-3 font-semibold text-gray-700">실기 2회</td>
                  <td className="px-3 py-3 text-center text-gray-600">8.17 ~ 8.20</td>
                  <td className="px-3 py-3 text-center text-gray-600">9.20 ~ 10.14</td>
                  <td className="px-3 py-3 text-center text-gray-600">11.4</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">※ 원서접수 첫날 10:00 ~ 마지막날 18:00 / Q-Net(www.q-net.or.kr)에서 접수</p>
        </div>

        {/* 합격률 */}
        <div className="bg-white rounded-2xl shadow p-6 mb-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📊 최근 합격률</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">35~40%</p>
              <p className="text-xs text-gray-500 mt-1">필기 평균 합격률</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-500">10~18%</p>
              <p className="text-xs text-gray-500 mt-1">실기 평균 합격률</p>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-gray-700">
            <p className="font-semibold text-yellow-700 mb-1">⚠️ 주의</p>
            <p>실기는 필답형(2시간)+작업형(4시간) 복합형으로 난이도가 높아요. 2018년부터 필답형이 추가되어 합격률이 크게 낮아졌습니다.</p>
          </div>
        </div>

        {/* 시험 주의사항 */}
        <div className="bg-white rounded-2xl shadow p-6 mb-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">⚠️ 시험 주의사항</h2>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <p className="text-gray-700">신분증 필수 지참 (주민등록증, 운전면허증, 여권 등)</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <p className="text-gray-700">CBT 필기시험 — 시험장 내 개인 계산기 지참 불가 (프로그램 제공)</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <p className="text-gray-700">시험 중 개인시계는 <span className="font-semibold text-red-500">아날로그 손목시계만</span> 착용 가능 (스마트워치 불가)</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <p className="text-gray-700">실기 작업형 — 안전화, 안전모 착용 필수</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <p className="text-gray-700">합격 기준: 60점 이상 (100점 만점, 과락 없음)</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <p className="text-gray-700">필기 합격 후 실기 응시 가능 기간: 2년</p>
            </div>
          </div>
        </div>

        {/* 준비물 */}
        <div className="bg-white rounded-2xl shadow p-6 mb-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🎒 준비물</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-semibold text-gray-700 mb-2 text-sm">📝 필기시험</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• 신분증</li>
                <li>• 수험표 (출력 또는 모바일)</li>
                <li>• 아날로그 손목시계</li>
                <li>• 마스크 (선택)</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-semibold text-gray-700 mb-2 text-sm">🔧 실기시험</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• 신분증 + 수험표</li>
                <li>• 안전화 (필수)</li>
                <li>• 공학용 계산기</li>
                <li>• 전선 작업 공구</li>
                <li>• 실기 재료비 약 80~90만원</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 응시자격 */}
        <div className="bg-white rounded-2xl shadow p-6 mb-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">✅ 응시 자격</h2>
          <div className="flex flex-col gap-2 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <p>전기기능사 취득 후 기능장 관련 실무 경력 5년 이상</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <p>동일 직무분야 산업기사 취득 후 실무 경력 5년 이상</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <p>동일 직무분야 기사 취득 후 실무 경력 1년 이상</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <p>관련학과 대졸 후 실무 경력 6년 이상</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <p>실무 경력 11년 이상 (자격 무관)</p>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 pb-4">
          ※ 정확한 일정은 Q-Net(www.q-net.or.kr)에서 반드시 확인하세요
        </div>
      </div>
    </div>
  )
}
