'use client';

import { logoutAction } from '@/app/actions/auth';
import { Panel, PixelButton } from '@/app/components/Pixel';
import { useSagaStore } from '@/lib/store';
import { useState } from 'react';

/**
 * 설정.
 *
 * 로그아웃은 캐릭터 화면 구석에 있었다. 거기서는 무엇에서 나가는 건지 —
 * 앱인지 캐릭터인지 — 알 수 없었다. 이름을 「로그아웃」으로 분명히 하고
 * 자기 자리를 줬다.
 */
export default function SettingsPage() {
  const job = useSagaStore((s) => s.job);
  const setJob = useSagaStore((s) => s.setJob);
  const [signingOut, setSigningOut] = useState(false);

  return (
    <>
      <h1 className="font-display text-xl text-ink sm:text-2xl">
        <span className="text-ink-disabled">▸ </span>설정
      </h1>

      <Panel title="현실의 생업">
        <p className="mb-3 text-xs leading-relaxed break-keep text-ink-muted">
          나비가 의뢰서를 쓸 때 참고합니다. 같은 「자료 정리」라도 개발자와
          학생에게 주는 의뢰가 달라집니다.
        </p>
        <input
          type="text"
          value={job}
          onChange={(e) => setJob(e.target.value)}
          placeholder="개발자, 학생, 디자이너..."
          className="w-full border-[3px] border-ink bg-sunken px-3 py-2.5 text-sm text-ink placeholder:text-ink-disabled focus:border-primary focus:outline-none"
        />
      </Panel>

      <Panel title="계정">
        <p className="mb-3 text-xs leading-relaxed break-keep text-ink-muted">
          로그아웃해도 사가의 서는 이 기기에 그대로 남습니다.
        </p>
        <PixelButton
          variant="ghost"
          disabled={signingOut}
          onClick={() => {
            setSigningOut(true);
            void logoutAction();
          }}
          className="px-4 py-2.5 text-xs"
        >
          {signingOut ? (
            <span className="animate-blink">로그아웃하는 중...</span>
          ) : (
            '로그아웃'
          )}
        </PixelButton>
      </Panel>
    </>
  );
}
