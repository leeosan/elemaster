"use client"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"

export default function KarnaughPage() {
  const router = useRouter()
  const [varCount, setVarCount] = useState<2 | 3 | 4>(4)
  const [values, setValues] = useState<(0 | 1 | "X")[]>(Array(16).fill(0))

  const total = Math.pow(2, varCount)

  const vars = useMemo(() => {
    if (varCount === 2) return ["A", "B"]
    if (varCount === 3) return ["A", "B", "C"]
    return ["A", "B", "C", "D"]
  }, [varCount])

  // 그레이 코드 순서
  const grayOrder = (n: number) => {
    if (n === 1) return [0, 1]
    if (n === 2) return [0, 1, 3, 2]
    return [0, 1, 3, 2] // 2비트 그레이 (4x4 맵용)
  }

  // 카르노맵 그리기 (변수별 행/열 결정)
  const getMapLayout = () => {
    if (varCount === 2) {
      return {
        rowBits: 1, colBits: 1,
        rowLabels: ["0", "1"], colLabels: ["0", "1"],
        rowVar: "A", colVar: "B",
        cellIndex: (r: number, c: number) => r * 2 + c,
      }
    }
    if (varCount === 3) {
      return {
        rowBits: 1, colBits: 2,
        rowLabels: ["0", "1"],
        colLabels: ["00", "01", "11", "10"],
        rowVar: "A", colVar: "BC",
        cellIndex: (r: number, c: number) => {
          const bc = [0, 1, 3, 2][c]
          return r * 4 + bc
        },
      }
    }
    return {
      rowBits: 2, colBits: 2,
      rowLabels: ["00", "01", "11", "10"],
      colLabels: ["00", "01", "11", "10"],
      rowVar: "AB", colVar: "CD",
      cellIndex: (r: number, c: number) => {
        const ab = [0, 1, 3, 2][r]
        const cd = [0, 1, 3, 2][c]
        return ab * 4 + cd
      },
    }
  }

  const layout = getMapLayout()
  const rows = Math.pow(2, layout.rowBits)
  const cols = Math.pow(2, layout.colBits)

  const updateValue = (index: number) => {
    const newValues = [...values]
    const current = newValues[index]
    if (current === 0) newValues[index] = 1
    else if (current === 1) newValues[index] = "X"
    else newValues[index] = 0
    setValues(newValues)
  }

  const updateTruthValue = (index: number) => {
    updateValue(index)
  }

  // Quine-McCluskey 간단 구현 (최소항 간소화)
  const simplify = useMemo(() => {
    const minterms: number[] = []
    const dontCares: number[] = []
    values.slice(0, total).forEach((v, i) => {
      if (v === 1) minterms.push(i)
      else if (v === "X") dontCares.push(i)
    })

    if (minterms.length === 0) return "F = 0"
    if (minterms.length + dontCares.length === total) return "F = 1"

    // 모든 가능한 imp 찾기 (간단 구현: prime implicant 근사)
    const allTerms = [...minterms, ...dontCares]
    const impCandidates: {mask: number, pattern: number, covers: Set<number>}[] = []

    // 크기별로 모든 그룹 시도 (1, 2, 4, 8, 16칸)
    for (let size = total; size >= 1; size /= 2) {
      for (let start = 0; start < total; start++) {
        const group: number[] = []
        for (let i = 0; i < size; i++) {
          const idx = (start + i) % total
          if (allTerms.includes(idx)) group.push(idx)
          else break
        }
        if (group.length === size && size === Math.pow(2, Math.log2(size) | 0)) {
          // 공통 비트 확인
          let andAll = group[0]
          let orAll = group[0]
          group.forEach(g => { andAll &= g; orAll |= g })
          const mask = (~(andAll ^ orAll)) & (total - 1)
          if (group.every(g => minterms.includes(g) || dontCares.includes(g))) {
            const covers = new Set(group.filter(g => minterms.includes(g)))
            if (covers.size > 0) {
              const key = `${mask}-${andAll & mask}`
              if (!impCandidates.find(c => c.mask === mask && c.pattern === (andAll & mask))) {
                impCandidates.push({mask, pattern: andAll & mask, covers})
              }
            }
          }
        }
      }
    }

    // 큰 그룹 우선 정렬
    impCandidates.sort((a, b) => b.covers.size - a.covers.size)

    const covered = new Set<number>()
    const selected: typeof impCandidates = []
    impCandidates.forEach(imp => {
      const newCovers = [...imp.covers].filter(c => !covered.has(c))
      if (newCovers.length > 0) {
        selected.push(imp)
        newCovers.forEach(c => covered.add(c))
      }
    })

    // 논리식 생성
    const terms = selected.map(({mask, pattern}) => {
      const parts: string[] = []
      for (let bit = varCount - 1; bit >= 0; bit--) {
        const bitMask = 1 << bit
        if (mask & bitMask) {
          const isOne = pattern & bitMask
          const varName = vars[varCount - 1 - bit]
          parts.push(isOne ? varName : varName + "̄")
        }
      }
      return parts.length > 0 ? parts.join("") : "1"
    })

    return "F = " + (terms.length > 0 ? terms.join(" + ") : "0")
  }, [values, varCount, vars, total])

  const getBinaryLabel = (index: number) => {
    return index.toString(2).padStart(varCount, "0")
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="text-gray-500 text-sm mb-3 hover:text-gray-700">← 뒤로</button>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">🧮 카르노맵 간소화 도구</h1>
        <p className="text-gray-500 text-sm mb-6">진리표를 입력하면 자동으로 간소화합니다</p>

        {/* 변수 개수 선택 */}
        <div className="bg-white rounded-xl shadow p-5 mb-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">변수 개수</p>
          <div className="flex gap-2">
            {[2, 3, 4].map(n => (
              <button key={n} onClick={() => { setVarCount(n as 2|3|4); setValues(Array(Math.pow(2, n)).fill(0)) }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${varCount === n ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                {n}변수
              </button>
            ))}
          </div>
        </div>

        {/* 진리표 */}
        <div className="bg-white rounded-xl shadow p-5 mb-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">진리표 (클릭: 0 → 1 → X → 0)</p>
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr className="bg-gray-100">
                  {vars.map(v => <th key={v} className="px-3 py-2 border">{v}</th>)}
                  <th className="px-3 py-2 border">F</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({length: total}).map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {getBinaryLabel(i).split("").map((bit, j) => (
                      <td key={j} className="px-3 py-2 border text-center">{bit}</td>
                    ))}
                    <td onClick={() => updateTruthValue(i)}
                      className={`px-3 py-2 border text-center cursor-pointer font-bold ${values[i] === 1 ? "bg-green-100 text-green-700" : values[i] === "X" ? "bg-yellow-100 text-yellow-700" : "bg-gray-50 text-gray-500"}`}>
                      {values[i]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 카르노맵 */}
        <div className="bg-white rounded-xl shadow p-5 mb-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            카르노맵 (행: {layout.rowVar}, 열: {layout.colVar})
          </p>
          <div className="overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-xs text-gray-500"></th>
                  {layout.colLabels.map(l => (
                    <th key={l} className="px-4 py-2 text-center text-sm font-semibold border bg-gray-100">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {layout.rowLabels.map((rowLabel, r) => (
                  <tr key={r}>
                    <td className="px-3 py-2 text-center text-sm font-semibold border bg-gray-100">{rowLabel}</td>
                    {layout.colLabels.map((_, c) => {
                      const idx = layout.cellIndex(r, c)
                      const val = values[idx]
                      return (
                        <td key={c} onClick={() => updateValue(idx)}
                          className={`px-6 py-4 text-center cursor-pointer border font-bold text-lg ${val === 1 ? "bg-green-100 text-green-700" : val === "X" ? "bg-yellow-100 text-yellow-700" : "bg-gray-50 text-gray-400"}`}>
                          {val}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 간소화 결과 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-blue-700 mb-2">✨ 간소화 결과</p>
          <p className="text-xl font-bold text-blue-900 font-mono">{simplify}</p>
        </div>

        <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800">
          💡 <strong>사용법</strong>: 진리표 또는 카르노맵의 F값을 클릭하면 0 → 1 → X(Don't Care) → 0 순서로 변경됩니다
        </div>
      </div>
    </div>
  )
}