'use client';

import { loginAction } from '@/app/actions/auth';
import { PixelButton } from '@/app/components/Pixel';
import { PixelSprite } from '@/app/components/PixelSprite';
import { WordmarkEmblem } from '@/app/components/Wordmark';
import { NABI, NABI_PALETTE } from '@/lib/sprite';
import { useState } from 'react';

export default function LoginPage() {
  const [id, setId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!id.trim()) {
      setError('ID를 입력하세요.');
      return;
    }

    const formData = new FormData();
    formData.append('id', id.trim());

    setLoading(true);
    try {
      await loginAction(formData);
    } catch {
      setError('잘못된 ID입니다.');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* 타이틀 */}
        <div className="mb-7 text-center">
          <div className="animate-float mb-4 flex justify-center">
            <PixelSprite
              layers={[NABI]}
              palette={NABI_PALETTE}
              size={64}
            />
          </div>
          <h1>
            <WordmarkEmblem />
          </h1>
          {/* 후킹은 기능 설명이 아니라 **사건**이어야 한다.
              "미루던 일이 퀘스트가 됩니다"는 기능 소개문이라 아무 감흥이 없다.
              웹소설 제목처럼 '~했더니 ~되었다'로 쓰면 한 줄에 이야기가 생긴다 */}
          <p className="mt-4 font-display text-[13px] leading-relaxed break-keep text-ink">
            말하는 고양이를 집사로 들였더니
            <span className="mt-1 block">미루던 일이 전부 의뢰서가 되었다</span>
            <span className="mt-2.5 block text-[10px] text-ink-disabled">
              집사 나비가 오늘의 의뢰서를 씁니다
            </span>
          </p>
        </div>

        {/* 로그인 창 */}
        <section className="border-[3px] border-ink bg-surface shadow-pixel">
          <header className="border-b-[3px] border-ink bg-ink px-3 py-2">
            <h2 className="font-display text-[13px] text-canvas">▸ 입장하기</h2>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
            <label className="flex flex-col gap-1.5">
              <span className="font-display text-[11px] text-ink-muted">ID</span>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="ID를 입력하세요"
                className="w-full border-[3px] border-ink bg-sunken px-3 py-2.5 text-sm text-ink placeholder:text-ink-disabled focus:border-primary focus:outline-none focus-visible:outline-none"
                autoComplete="username"
                required
                disabled={loading}
              />
            </label>

            {error && (
              <p className="border-2 border-danger bg-surface px-3 py-2 font-display text-[11px] text-danger">
                ! {error}
              </p>
            )}

            <PixelButton
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm"
            >
              {loading ? (
                <span className="animate-blink">입장 중...</span>
              ) : (
                '입장하기'
              )}
            </PixelButton>
          </form>
        </section>
      </div>
    </div>
  );
}
