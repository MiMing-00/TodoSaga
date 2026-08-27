'use client';

import { Chronicle } from '@/app/components/Chronicle';
import { useSagaStore } from '@/lib/store';

export default function ChroniclePage() {
  const days = useSagaStore((s) => s.days);
  const lastSeenBookMonth = useSagaStore((s) => s.lastSeenBookMonth);
  const markBookSeen = useSagaStore((s) => s.markBookSeen);

  return (
    <>
      <div>
        <h1 className="font-display text-lg text-ink sm:text-xl">▸ 기록</h1>
        <p className="mt-2 text-xs break-keep text-ink-muted">
          나비가 용사님의 하루하루를 받아 적어 둔 책입니다.
        </p>
      </div>

      <Chronicle
        days={days}
        lastSeenBookMonth={lastSeenBookMonth}
        onSeenBook={markBookSeen}
      />
    </>
  );
}
