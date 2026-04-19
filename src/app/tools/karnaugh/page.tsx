'use client';

import { useState, useMemo } from 'react';

// ============================================================================
// Types & Constants
// ============================================================================
type CellValue = 0 | 1 | 'X';

type KMapConfig = {
  size: 2 | 3 | 4;
  vars: string[];
  rowBits: number;
  colBits: number;
  rowLabel: string;
  colLabel: string;
};

const GRAY = [0, 1, 3, 2]; // 그레이 코드: 00, 01, 11, 10
const GRAY_LABELS = ['00', '01', '11', '10'];

const COLORS = [
  '#3B82F6', // blue
  '#22C55E', // green
  '#F59E0B', // orange
  '#EC4899', // pink
  '#A855F7', // purple
  '#EF4444', // red
  '#14B8A6', // teal
  '#F97316', // dark orange
];

const CONFIGS: Record<number, KMapConfig> = {
  2: { size: 2, vars: ['a', 'b'],           rowBits: 1, colBits: 1, rowLabel: 'a',  colLabel: 'b'  },
  3: { size: 3, vars: ['a', 'b', 'c'],      rowBits: 1, colBits: 2, rowLabel: 'a',  colLabel: 'bc' },
  4: { size: 4, vars: ['a', 'b', 'c', 'd'], rowBits: 2, colBits: 2, rowLabel: 'ab', colLabel: 'cd' },
};

// ============================================================================
// Cell ↔ Minterm mapping (그레이 코드 적용)
// ============================================================================
function cellToMinterm(row: number, col: number, config: KMapConfig): number {
  const rowVal = config.rowBits === 2 ? GRAY[row] : row;
  const colVal = config.colBits === 2 ? GRAY[col] : col;
  return (rowVal << config.colBits) | colVal;
}

function mintermToCell(m: number, config: KMapConfig): { row: number; col: number } {
  const rowVal = m >> config.colBits;
  const colVal = m & ((1 << config.colBits) - 1);
  const row = config.rowBits === 2 ? GRAY.indexOf(rowVal) : rowVal;
  const col = config.colBits === 2 ? GRAY.indexOf(colVal) : colVal;
  return { row, col };
}

// ============================================================================
// Quine-McCluskey 간소화
// ============================================================================
function combine(a: string, b: string): string | null {
  let diff = 0, result = '';
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '-' && b[i] === '-') result += '-';
    else if (a[i] === '-' || b[i] === '-') return null;
    else if (a[i] === b[i]) result += a[i];
    else {
      diff++;
      if (diff > 1) return null;
      result += '-';
    }
  }
  return diff === 1 ? result : null;
}

function getPrimes(bits: number[], varCount: number): string[] {
  let current = Array.from(new Set(bits.map(n => n.toString(2).padStart(varCount, '0'))));
  const primes = new Set<string>();

  while (current.length > 0) {
    const used = new Set<string>();
    const next = new Set<string>();

    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const c = combine(current[i], current[j]);
        if (c) {
          next.add(c);
          used.add(current[i]);
          used.add(current[j]);
        }
      }
    }

    for (const c of current) if (!used.has(c)) primes.add(c);
    current = Array.from(next);
  }

  return Array.from(primes);
}

function primeMinterms(prime: string): number[] {
  const dashes: number[] = [];
  for (let i = 0; i < prime.length; i++) if (prime[i] === '-') dashes.push(i);

  const L = prime.length;
  const result: number[] = [];
  for (let mask = 0; mask < (1 << dashes.length); mask++) {
    let val = 0;
    for (let i = 0; i < L; i++) {
      const shift = L - 1 - i;
      if (prime[i] === '1') val |= (1 << shift);
      else if (prime[i] === '-') {
        const di = dashes.indexOf(i);
        if (mask & (1 << di)) val |= (1 << shift);
      }
    }
    result.push(val);
  }
  return result;
}

function primeToTerm(prime: string, vars: string[]): string {
  let term = '';
  for (let i = 0; i < prime.length; i++) {
    if (prime[i] === '0') term += vars[i] + "'";
    else if (prime[i] === '1') term += vars[i];
  }
  return term || '1';
}

function selectCover(primes: string[], required: number[]): string[] {
  if (required.length === 0 || primes.length === 0) return [];

  const pm = primes.map(p => ({ p, covers: primeMinterms(p).filter(m => required.includes(m)) }));
  const covered = new Set<number>();
  const selected = new Set<string>();

  // 필수 주항 (Essential Prime Implicants)
  for (const m of required) {
    const coverers = pm.filter(x => x.covers.includes(m));
    if (coverers.length === 1) {
      selected.add(coverers[0].p);
      coverers[0].covers.forEach(c => covered.add(c));
    }
  }

  // 탐욕 알고리즘으로 나머지 커버
  while (covered.size < required.length) {
    let best: typeof pm[0] | null = null;
    let bestCount = 0;
    for (const x of pm) {
      if (selected.has(x.p)) continue;
      const u = x.covers.filter(m => !covered.has(m)).length;
      if (u > bestCount) { bestCount = u; best = x; }
    }
    if (!best) break;
    selected.add(best.p);
    best.covers.forEach(c => covered.add(c));
  }

  return Array.from(selected);
}

type Group = { prime: string; cells: number[]; color: string; term: string };

function simplify(values: CellValue[], config: KMapConfig): { expr: string; groups: Group[] } {
  const ones = values.map((v, i) => v === 1 ? i : -1).filter(i => i >= 0);
  const xs = values.map((v, i) => v === 'X' ? i : -1).filter(i => i >= 0);

  if (ones.length === 0) return { expr: '0', groups: [] };
  if (ones.length + xs.length === values.length) return { expr: '1', groups: [] };

  const primes = getPrimes([...ones, ...xs], config.size);
  const cover = selectCover(primes, ones);

  const groups: Group[] = cover.map((prime, i) => ({
    prime,
    cells: primeMinterms(prime),
    color: COLORS[i % COLORS.length],
    term: primeToTerm(prime, config.vars),
  }));

  const expr = groups.map(g => g.term).join(' + ');
  return { expr, groups };
}

// ============================================================================
// 묶음 사각형 계산 (wrap-around 지원)
// ============================================================================
function getGroupRects(cells: number[], config: KMapConfig) {
  const numRows = 1 << config.rowBits;
  const numCols = 1 << config.colBits;
  const positions = cells.map(m => mintermToCell(m, config));

  const rowsUsed = Array.from(new Set(positions.map(p => p.row))).sort((a, b) => a - b);
  const colsUsed = Array.from(new Set(positions.map(p => p.col))).sort((a, b) => a - b);

  const getRanges = (arr: number[], total: number): [number, number][] => {
    if (arr.length === total) return [[0, total - 1]];
    const contiguous = arr.every((n, i) => i === 0 || n === arr[i - 1] + 1);
    if (contiguous) return [[arr[0], arr[arr.length - 1]]];
    if (arr[0] === 0 && arr[arr.length - 1] === total - 1) {
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i + 1] !== arr[i] + 1) {
          return [[0, arr[i]], [arr[i + 1], total - 1]];
        }
      }
    }
    return [[arr[0], arr[arr.length - 1]]];
  };

  const rowRanges = getRanges(rowsUsed, numRows);
  const colRanges = getRanges(colsUsed, numCols);

  const rects: { row: number; col: number; rowSpan: number; colSpan: number }[] = [];
  for (const [r1, r2] of rowRanges) {
    for (const [c1, c2] of colRanges) {
      let valid = true;
      for (let r = r1; r <= r2 && valid; r++) {
        for (let c = c1; c <= c2 && valid; c++) {
          if (!cells.includes(cellToMinterm(r, c, config))) valid = false;
        }
      }
      if (valid) rects.push({ row: r1, col: c1, rowSpan: r2 - r1 + 1, colSpan: c2 - c1 + 1 });
    }
  }

  return rects;
}

// ============================================================================
// 컴포넌트
// ============================================================================
const CELL = 56;
const HEADER = 56;

export default function KarnaughMap() {
  const [varCount, setVarCount] = useState<2 | 3 | 4>(3);
  const [values, setValues] = useState<CellValue[]>(() => Array(8).fill(0));

  const config = CONFIGS[varCount];
  const numRows = 1 << config.rowBits;
  const numCols = 1 << config.colBits;

  const { expr, groups } = useMemo(() => simplify(values, config), [values, config]);

  const handleVarChange = (n: 2 | 3 | 4) => {
    setVarCount(n);
    setValues(Array(1 << n).fill(0));
  };

  const cycleValue = (m: number) => {
    const nv = [...values];
    nv[m] = nv[m] === 0 ? 1 : nv[m] === 1 ? 'X' : 0;
    setValues(nv);
  };

  const reset = () => setValues(Array(1 << varCount).fill(0));

  const totalW = HEADER + numCols * CELL;
  const totalH = HEADER + numRows * CELL;

  const colHeaders = config.colBits === 2 ? GRAY_LABELS : ['0', '1'];
  const rowHeaders = config.rowBits === 2 ? GRAY_LABELS : ['0', '1'];

  return (
    <div className="space-y-4">
      {/* 변수 개수 선택 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="text-sm font-semibold mb-2 text-gray-700">변수 개수</div>
        <div className="flex gap-2 items-center">
          {([2, 3, 4] as const).map(n => (
            <button
              key={n}
              onClick={() => handleVarChange(n)}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition ${
                varCount === n ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {n}변수
            </button>
          ))}
          <button
            onClick={reset}
            className="ml-auto px-4 py-2 rounded-lg font-medium text-sm bg-gray-100 hover:bg-gray-200 text-gray-600"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 진리표 + 카르노맵 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 진리표 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm font-semibold mb-3 text-gray-700">
            진리표 <span className="text-xs text-gray-400 font-normal">(클릭: 0 → 1 → X → 0)</span>
          </div>
          <div className="overflow-auto">
            <table className="border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-gray-50 px-2 py-1.5 text-gray-500 text-xs">#</th>
                  {config.vars.map(v => (
                    <th key={v} className="border border-gray-300 bg-gray-50 px-3 py-1.5 font-mono">{v}</th>
                  ))}
                  <th className="border border-gray-300 bg-gray-50 px-3 py-1.5 font-mono">F</th>
                </tr>
              </thead>
              <tbody>
                {values.map((v, i) => {
                  const bits = i.toString(2).padStart(varCount, '0').split('').map(Number);
                  return (
                    <tr key={i}>
                      <td className="border border-gray-300 px-2 py-1 text-center font-mono text-gray-400 text-xs">{i}</td>
                      {bits.map((b, j) => (
                        <td key={j} className="border border-gray-300 px-3 py-1 text-center font-mono text-gray-600">{b}</td>
                      ))}
                      <td
                        onClick={() => cycleValue(i)}
                        className={`border border-gray-300 px-3 py-1 text-center font-mono font-bold cursor-pointer hover:bg-blue-50 transition ${
                          v === 1 ? 'text-red-600' : v === 'X' ? 'text-purple-600' : 'text-gray-300'
                        }`}
                      >
                        {v}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 카르노맵 */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm font-semibold mb-3 text-gray-700">카르노맵</div>
          <div className="overflow-auto">
            <div className="relative inline-block" style={{ width: totalW, height: totalH }}>
              <table className="border-collapse" style={{ width: totalW, height: totalH }}>
                <tbody>
                  {/* 헤더 행 */}
                  <tr>
                    {/* 대각선 분할 좌상단 셀 */}
                    <th
                      className="relative border border-gray-400 bg-gray-50 p-0"
                      style={{ width: HEADER, height: HEADER }}
                    >
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line
                          x1="0" y1="0" x2="100" y2="100"
                          stroke="#6B7280" strokeWidth="1.5"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                      <span className="absolute top-1 right-2 text-sm font-mono font-bold text-gray-700">{config.colLabel}</span>
                      <span className="absolute bottom-1 left-2 text-sm font-mono font-bold text-gray-700">{config.rowLabel}</span>
                    </th>
                    {colHeaders.map((h, i) => (
                      <th
                        key={i}
                        className="border border-gray-400 bg-gray-50 font-mono text-sm font-bold text-gray-700"
                        style={{ width: CELL, height: HEADER }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                  {/* 데이터 행 */}
                  {Array.from({ length: numRows }).map((_, row) => (
                    <tr key={row}>
                      <th
                        className="border border-gray-400 bg-gray-50 font-mono text-sm font-bold text-gray-700"
                        style={{ width: HEADER, height: CELL }}
                      >
                        {rowHeaders[row]}
                      </th>
                      {Array.from({ length: numCols }).map((_, col) => {
                        const m = cellToMinterm(row, col, config);
                        const v = values[m];
                        return (
                          <td
                            key={col}
                            onClick={() => cycleValue(m)}
                            className={`relative border border-gray-400 text-center font-mono font-bold cursor-pointer hover:bg-blue-50 transition ${
                              v === 1 ? 'text-red-600 text-xl' : v === 'X' ? 'text-purple-600 text-xl' : 'text-gray-300 text-xl'
                            }`}
                            style={{ width: CELL, height: CELL }}
                          >
                            <span className="absolute top-0.5 left-1 text-[10px] text-gray-400 font-normal">{m}</span>
                            {v}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 묶음 SVG 오버레이 */}
              <svg
                className="absolute pointer-events-none"
                style={{ left: 0, top: 0 }}
                width={totalW}
                height={totalH}
              >
                {groups.flatMap((g, gi) => {
                  const rects = getGroupRects(g.cells, config);
                  const inset = 4 + gi * 3; // 여러 그룹 겹침 시 차등 오프셋
                  return rects.map((r, ri) => {
                    const x = HEADER + r.col * CELL + inset;
                    const y = HEADER + r.row * CELL + inset;
                    const w = r.colSpan * CELL - 2 * inset;
                    const h = r.rowSpan * CELL - 2 * inset;
                    const rx = Math.min(w, h) / 2;
                    return (
                      <rect
                        key={`${gi}-${ri}`}
                        x={x} y={y} width={w} height={h}
                        rx={rx} ry={rx}
                        fill="none"
                        stroke={g.color}
                        strokeWidth={2.5}
                      />
                    );
                  });
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 간소화 결과 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-xl">
        <div className="text-sm font-semibold text-gray-700 mb-3">✨ 간소화 결과 (SOP)</div>
        <div className="text-2xl font-mono font-bold text-blue-900">F = {expr}</div>

        {groups.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
            {groups.map((g, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/70 px-3 py-2 rounded-lg">
                <div
                  className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                  style={{ borderColor: g.color }}
                />
                <span className="font-mono text-sm font-semibold text-gray-800">{g.term}</span>
                <span className="text-xs text-gray-500">({g.cells.length}칸)</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 사용법 */}
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-gray-700">
        💡 <b>사용법</b>: F 값을 클릭하면{' '}
        <span className="text-gray-400 font-mono">0</span> →{' '}
        <span className="text-red-600 font-mono font-bold">1</span> →{' '}
        <span className="text-purple-600 font-mono font-bold">X</span>(무관항) →{' '}
        <span className="text-gray-400 font-mono">0</span> 순서로 변경됩니다.
        시험 표준: 변수 <span className="font-mono font-bold">a, b, c, d</span>,
        그레이 코드 <span className="font-mono">00 → 01 → 11 → 10</span>.
      </div>
    </div>
  );
}
