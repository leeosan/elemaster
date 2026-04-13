'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ExamRound {
  round: number;
  year: number;
  count: number;
}

export default function PastExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examTypeId = searchParams.get('exam') || '1';

  const [rounds, setRounds] = useState<ExamRound[]>([]);
  const [loading, setLoading] = useState(true);

  const examNames: { [key: string]: string } = {
    '1': '전기기능장',
    '2': '전기기사',
    '3': '전기산업기사',
    '4': '전기기능사',
  };

  useEffect(() => {
    fetchRounds();
  }, [examTypeId]);

  async function fetchRounds() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('questions')
      .select('round, year')
      .eq('exam_type_id', parseInt(examTypeId))
      .order('round', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const roundMap: { [key: number]: ExamRound } = {};
    data?.forEach((q) => {
      if (!roundMap[q.round]) {
        roundMap[q.round] = { round: q.round, year: q.year, count: 0 };
      }
      roundMap[q.round].count++;
    });

    const roundList = Object.values(roundMap).sort((a, b) => b.round - a.round);
    setRounds(roundList);
    setLoading(false);
  }

  function startExam(round: number) {
    router.push(`/cbt/start?exam=${examTypeId}&round=${round}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-blue-200 hover:text-white mb-2 text-sm"
          >
            ← 뒤로
          </button>
          <h1 className="text-2xl font-bold">📋 과년도 기출문제</h1>
          <p className="text-blue-200 mt-1">{examNames[examTypeId] || '전기기능장'}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">불러오는 중...</div>
        ) : rounds.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            준비된 문제가 없습니다.
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4 text-sm">
              총 <span className="font-bold text-blue-600">{rounds.length}회차</span> 기출문제가 준비되어 있습니다.
            </p>
            <div className="space-y-3">
              {rounds.map((r) => (
                <button
                  key={r.round}
                  onClick={() => startExam(r.round)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-blue-400 hover:shadow-md transition-all text-left"
                >
                  <div>
                    <div className="font-bold text-gray-800">
                      제 {r.round}회
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {r.year}년 · {r.count}문제
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      CBT 풀기
                    </span>
                    <span className="text-gray-400">→</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
