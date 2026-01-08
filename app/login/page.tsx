'use client';

import { loginAction } from '@/app/actions/auth';
import { useState } from 'react';

export default function LoginPage() {
  const [id, setId] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    
    // 간단한 클라이언트 사이드 검증
    if (!id) {
      setError('ID를 입력하세요.');
      return;
    }
    
    const formData = new FormData();
    formData.append('id', id);
    
    try {
      await loginAction(formData);
    } catch (err) {
      setError('잘못된 ID입니다.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#87CEEB] to-[#E0F6FF] flex items-center justify-center p-4">
      <div className="pixel-container bg-white border-4 border-black shadow-[8px_8px_0_0_#000] max-w-md w-full">
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h1 className="pixel-text text-4xl font-bold mb-2 text-black">
              🎀 TODOSAGA 🎀
            </h1>
            <p className="pixel-text text-sm text-gray-600">
              ID를 입력하세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="ID 입력"
                className="pixel-input w-full px-4 py-3 border-4 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0_0_#000] transition-shadow"
                required
              />
            </div>

            {error && (
              <div className="pixel-text text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="pixel-button w-full py-3 bg-[#FF6B6B] border-4 border-black text-white font-bold hover:bg-[#FF5252] hover:shadow-[4px_4px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            >
              입장하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
