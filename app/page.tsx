'use client';

import { logoutAction } from '@/app/actions/auth';
import { generateQuests } from '@/app/actions/quest';
import { useEffect, useState } from 'react';

interface Quest {
  title: string;
  category: 'STR' | 'INT' | 'CHA' | 'VIT' | 'LUK';
  rank: 'F' | 'D' | 'C' | 'B' | 'A' | 'S';
  objective: string;
  rewards: {
    exp: number;
    gold: number;
    loot: string;
  };
  flavor_text: string;
  debuff: string;
  completed: boolean;
}

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [userJob, setUserJob] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('todosaga_userJob') || '';
    }
    return '';
  });
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exp, setExp] = useState(0);
  const [gold, setGold] = useState(0);
  const [level, setLevel] = useState(1);

  // 레벨 계산: 레벨 1 = 0-99, 레벨 2 = 100-199, 레벨 3 = 200-299...
  const expToNextLevel = 100;
  const expInCurrentLevel = exp % 100;

  // 직업이 변경될 때 localStorage에 저장
  useEffect(() => {
    if (userJob.trim()) {
      localStorage.setItem('todosaga_userJob', userJob);
    }
  }, [userJob]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userJob.trim()) {
      setError('직업을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');

    const result = await generateQuests(userInput, userJob);
    
    if (result.error) {
      setError(result.error);
    } else if (result.quests) {
      setQuests((prev) => [...prev, ...result.quests]);
      setUserInput('');
    }
    
    setLoading(false);
  }

  function completeQuest(index: number) {
    setQuests((prev) => {
      const updated = [...prev];
      if (!updated[index].completed) {
        updated[index].completed = true;
        const { exp: gainedExp, gold: gainedGold } = updated[index].rewards;
        setExp((prevExp) => {
          const newExp = prevExp + gainedExp;
          // 레벨 계산: 100 경험치마다 레벨업
          const newLevel = Math.floor(newExp / 100) + 1;
          if (newLevel > level) {
            setLevel(newLevel);
          }
          return newExp;
        });
        setGold((prevGold) => prevGold + gainedGold);
      }
      return updated;
    });
  }

  function handleLogout() {
    logoutAction();
  }

  // 오늘 날짜 포맷팅 함수
  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[today.getDay()];
    
    return `${year}년 ${month}월 ${date}일 (${dayName})`;
  }

  const todayDate = getTodayDate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                🎀 TODOSAGA RPG 🎀
              </h1>
              <div className="text-sm text-gray-600 mb-3">
                <span className="font-semibold">Level {level}</span> | 
                <span className="ml-2">EXP: {expInCurrentLevel} / {expToNextLevel}</span> | 
                <span className="ml-2">Gold: {gold} 🪙</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min((expInCurrentLevel / expToNextLevel) * 100, 100)}%` }}
                />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* AI 입력 영역 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-3xl">✨</span>
            <span>나비에게 할 일 말하기</span>
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                직업
              </label>
              <input
                type="text"
                value={userJob}
                onChange={(e) => setUserJob(e.target.value)}
                placeholder="예: 개발자, 학생, 디자이너..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                {todayDate} 할 일
              </label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={`예: ${todayDate.split(' ')[0]} 회의 준비하고, 운동하고, 블로그 포스팅 하나 작성할 거야`}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                rows={4}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
            >
              {loading ? '퀘스트 생성 중...' : '퀘스트 생성하기 ✨'}
            </button>
          </form>
        </div>

        {/* 퀘스트 리스트 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-3xl">📜</span>
            <span>현재 퀘스트</span>
          </h2>
          {quests.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500 text-lg">
                아직 퀘스트가 없습니다. AI에게 할 일을 말해보세요! ✨
              </p>
            </div>
          ) : (
            quests.map((quest, index) => (
              <div
                key={index}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border transition-all duration-200 ${
                  quest.completed
                    ? 'opacity-60 border-gray-200'
                    : 'border-gray-200 hover:shadow-xl hover:border-purple-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <h3
                          className={`text-xl font-bold ${
                            quest.completed
                              ? 'line-through text-gray-400'
                              : 'text-gray-800'
                          }`}
                        >
                          {quest.title}
                        </h3>
                        <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-full px-2.5 py-1">
                          {quest.rank}
                        </span>
                        <span className="text-xs font-semibold bg-cyan-100 text-cyan-800 border border-cyan-300 rounded-full px-2.5 py-1">
                          {quest.category}
                        </span>
                        <span className="text-xs font-semibold bg-green-100 text-green-800 border border-green-300 rounded-full px-2.5 py-1">
                          +{quest.rewards.exp} EXP
                        </span>
                        <span className="text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 rounded-full px-2.5 py-1">
                          +{quest.rewards.gold} 🪙
                        </span>
                      </div>
                      <p
                        className={`text-sm font-semibold mb-2 ${
                          quest.completed ? 'text-gray-400' : 'text-gray-700'
                        }`}
                      >
                        목표: {quest.objective}
                      </p>
                      <p
                        className={`text-sm italic mb-2 ${
                          quest.completed ? 'text-gray-400' : 'text-blue-600'
                        }`}
                      >
                        💬 {quest.flavor_text}
                      </p>
                      {!quest.completed && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 inline-block">
                          ⚠️ 실패 시: {quest.debuff}
                        </p>
                      )}
                      {quest.rewards.loot && (
                        <p className="text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 inline-block mt-2">
                          🎁 보상: {quest.rewards.loot}
                        </p>
                      )}
                    </div>
                    {!quest.completed && (
                      <button
                        onClick={() => completeQuest(index)}
                        className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 whitespace-nowrap"
                      >
                        완료 ✓
                      </button>
                    )}
                    {quest.completed && (
                      <div className="text-3xl">✅</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
