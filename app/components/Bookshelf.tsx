'use client';

import type { BookSlot } from '@/lib/chronicle';
import { CATEGORY } from '@/lib/quest';
import { useState } from 'react';
import { BookSpine, chapterIndexFor, MURAL_CHAPTER_STORY, SPINE_W } from './BookSpine';

/**
 * 책장 — 한 달에 한 권, 열두 권이 한 단.
 *
 * docs/LORE.md "권(卷) — 사가의 매듭". 완료된 달만 책이 되어 꽂힌다.
 * 아무것도 안 적힌 달은 빈 자리로 영원히 남는다 — 그림자와 같은 이치로
 * (docs/LORE.md "위험은 정말 없는가"), 되돌릴 수 없다는 걸 숨기지
 * 않는다. 이번 달은 아직 안 묶였으니 책이 아니라 쌓여 가는 낱장으로
 * 보여준다.
 *
 * 책은 틈 없이 붙여 세운다 — 가죽 무늬(BookSpine)가 옆 책과 이어지려면
 * 사이가 벌어지면 안 된다. 실제 책장도 그렇게 빽빽하다.
 *
 * **13권째부터는 옆으로 안 늘어난다.** 한 단에 열두 권(그림 한 판)만
 * 세우고, 13권째는 그 위에 새 단을 놓는다 — 실제 책장이 다 차면
 * 위 칸에 꽂듯이. 높이는 그대로 두고 위/아래 화살표로 단을 오간다.
 * 기본으로는 가장 오래된(맨 아래) 단을 보여준다 — 화살표가 있어야
 * "더 있다"는 게 느껴진다.
 */
const BOOKS_PER_SHELF = 12;

function groupIntoShelves(slots: BookSlot[]): BookSlot[][] {
  const shelves: BookSlot[][] = [[]];
  let volumesOnShelf = 0;

  for (const slot of slots) {
    if (slot.status === 'bound') {
      if (volumesOnShelf >= BOOKS_PER_SHELF) {
        shelves.push([]);
        volumesOnShelf = 0;
      }
      volumesOnShelf += 1;
    }
    shelves[shelves.length - 1].push(slot);
  }
  return shelves;
}

export function Bookshelf({
  slots,
  onPick,
}: {
  slots: BookSlot[];
  onPick: (year: number, month: number) => void;
}) {
  const shelves = groupIntoShelves(slots);
  const [shelfIndex, setShelfIndex] = useState(0);

  if (slots.length === 0) return null;

  // 단이 새로 생겨도(13권째 등장) 지금 보던 단이 사라지는 게 아니니 그대로
  // 둔다 — 다만 범위를 벗어나면(데이터가 줄어든 경우 등) 읽는 시점에 붙잡는다.
  // 이펙트로 상태를 되튕기지 않는다 — 매 렌더에서 그냥 다시 계산하면 된다

  const current = shelves[Math.min(shelfIndex, shelves.length - 1)] ?? [];
  const hasMultipleShelves = shelves.length > 1;

  // 옆에 뜬 이야기 — 지금 이 단이 다섯 장 중 몇 번째인지. 그림에만
  // 담겨 있고 어디에도 글로 적힌 적이 없었다("옆에 너무 많이 남는데").
  //
  // 다섯 장을 다 돌면(6단부터) 그림은 1장부터 그대로 되풀이된다. 그때도
  // 매번 새 이야기를 써야 한다면 끝이 없다("이러면 영원히 다른 장을
  // 만들어야 해") — 그러니 **첫 순환에서만** 이 이야기를 보여준다.
  // 두 번째 순환부터는 이야기 칸을 아예 비우고, 그 달 가장 많이 쌓은
  // 자질 아이콘을 **책 위에 직접** 찍는다(아래 렌더링) — 새로 지어낼
  // 것 없이 실제 기록에서 그대로 나오니 순환이 몇 바퀴든 그대로 이어진다.
  const boundInView = current.find((s) => s.status === 'bound');
  const isFirstCycle = boundInView
    ? Math.floor((boundInView.volume! - 1) / BOOKS_PER_SHELF) < MURAL_CHAPTER_STORY.length
    : true;
  const chapter =
    boundInView && isFirstCycle
      ? MURAL_CHAPTER_STORY[chapterIndexFor(boundInView.volume!)]
      : null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-display text-[11px] text-ink-muted">책장</p>
        {hasMultipleShelves && (
          <p className="font-display text-[10px] text-ink-disabled">
            {shelfIndex + 1} / {shelves.length}단
          </p>
        )}
      </div>

      {/* 위 화살표 — 13권째가 생겨서 위 단이 있을 때만 보인다 */}
      {hasMultipleShelves && (
        <button
          type="button"
          onClick={() => setShelfIndex((i) => Math.min(i + 1, shelves.length - 1))}
          disabled={shelfIndex >= shelves.length - 1}
          aria-label="위 칸 보기"
          title="위 칸 — 다음 열두 권"
          className="press mx-auto mb-1 flex h-5 w-8 items-center justify-center border-2 border-ink bg-surface font-display text-[10px] text-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          ▲
        </button>
      )}

      <div className="flex items-stretch gap-3">
        {/* 선반 — 갈색 판자 위에 책을 세운다.
            열두 권 폭을 늘 유지한다 — 아직 몇 권 안 찼다고 판자까지
            같이 줄면("책장 크기는 12권 크기 유지"), 옆 이야기 칸이
            거의 전체 폭을 차지해 버린다. 넘치면(13권째~) 그때 가로 스크롤 */}
        <div
          className="max-w-full shrink-0 border-2 border-ink bg-[#5c4632] p-2 shadow-pixel-sm"
          style={{ width: BOOKS_PER_SHELF * SPINE_W + 20 }}
        >
          <div className="flex max-w-full items-end overflow-x-auto">
            {current.map((slot) => {
              const label = `${slot.year}년 ${slot.month}월`;

              if (slot.status === 'writing') {
                return (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => onPick(slot.year, slot.month)}
                    title={`${label} · 아직 쓰는 중`}
                    className="press flex h-[260px] shrink-0 flex-col justify-end border-2 border-dashed border-canvas/50 bg-canvas/90"
                    style={{ width: SPINE_W }}
                  >
                    <span
                      aria-hidden
                      className="w-full bg-ink-muted/60"
                      style={{
                        height: `${Math.round((slot.progress ?? 0) * 100)}%`,
                      }}
                    />
                  </button>
                );
              }

              if (slot.status === 'empty') {
                return (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => onPick(slot.year, slot.month)}
                    title={`${label} · 아무것도 적히지 않은 채 지나갔어요`}
                    className="press h-[260px] shrink-0 border border-dashed border-black/30 bg-black/25"
                    style={{ width: SPINE_W * 0.6 }}
                  />
                );
              }

              // 두 번째 순환부터(다섯 장을 다 돌고 그림이 되풀이되는
              // 책)는 그 달 가장 많이 쌓은 자질 아이콘을 책 위에 직접
              // 찍는다("책들에 이제 아이콘이 나타나라는 소리였어") —
              // 옆 이야기 칸이 아니라 그 책 자신에게 붙는다
              const repeatCycle =
                Math.floor((slot.volume! - 1) / BOOKS_PER_SHELF) >= MURAL_CHAPTER_STORY.length;
              const badge = repeatCycle && slot.dominant ? CATEGORY[slot.dominant] : null;

              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => onPick(slot.year, slot.month)}
                  title={`제${slot.volume}권 「${slot.title}」 · ${label}`}
                  className="press relative shrink-0"
                >
                  <BookSpine volume={slot.volume!} />
                  {badge && (
                    <span
                      aria-hidden
                      className="absolute top-1 left-1/2 -translate-x-1/2 text-[13px] leading-none text-canvas drop-shadow-[0_1px_0_rgba(0,0,0,0.6)]"
                    >
                      {badge.icon}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 옆에 뜬 이야기 — 다섯 장 중 지금 이 단이 몇 번째인지.
            지금까지는 그림에만 담겨 있고 어디에도 글로 적힌 적이 없었다.
            "1장 그림자가 생김" 정도로는 부족하다길래("나레이션하듯이
            긴 글로") 나비가 용사님께 직접 여쭙는 투(1인칭, "용사님
            어쩌구 하는 거")로 다시 썼다(MURAL_CHAPTER_STORY) — 짧은
            제목이 아니라 몇 문장짜리 이야기라 넘치면 안쪽에서만
            스크롤되게 한다.
            min-w-0이 핵심이다 — 없으면 글이 길다고 이 칸이 옆으로
            넓어지길 고집하다 폭이 모자라면 아예 아래 줄로 떨어져
            버린다("옆에다가 구겨넣으라니까 그러면 또 옆에가 비잖아").
            폭을 고집하지 않고 남는 자리만큼만 차지한 뒤, 그 안에서
            글씨만 여러 줄로 접히게 한다 */}
        {chapter && (
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto border-2 border-ink bg-sunken px-3 py-2.5">
            <p className="font-display text-[10px] text-ink-disabled">
              {chapterIndexFor(boundInView!.volume!) + 1}장
            </p>
            <p className="mt-0.5 font-display text-[12px] text-ink">
              {chapter.title}
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed break-keep text-ink-muted">
              {chapter.blurb}
            </p>
          </div>
        )}
      </div>

      {/* 아래 화살표 — 위 단으로 넘어온 뒤에만 보인다. 위로만 가고 못
          내려오면 화살표가 절반짜리다 */}
      {hasMultipleShelves && (
        <button
          type="button"
          onClick={() => setShelfIndex((i) => Math.max(i - 1, 0))}
          disabled={shelfIndex <= 0}
          aria-label="아래 칸 보기"
          title="아래 칸 — 이전 열두 권"
          className="press mx-auto mt-1 flex h-5 w-8 items-center justify-center border-2 border-ink bg-surface font-display text-[10px] text-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          ▼
        </button>
      )}
    </div>
  );
}
