'use client';

/**
 * 소지품 — 모은 재화를 확인하는 곳.
 * 골드는 크게 보여주고, 지금까지 화면에서 스쳐 지나가기만 하던
 * 퀘스트 전리품(rewards.loot)을 여기에 모아 쌓는다.
 */
export function Vault({
  gold,
  loot,
}: {
  gold: number;
  loot: { name: string; count: number }[];
}) {
  const totalLoot = loot.reduce((sum, l) => sum + l.count, 0);

  return (
    <div className="flex flex-col gap-4 border-[3px] border-ink bg-surface p-4 shadow-pixel sm:p-5">
      {/* 골드 */}
      <div>
        <p className="font-display text-[11px] text-ink-muted sm:text-xs">
          여비
        </p>
        <p className="mt-1.5 flex items-center gap-2 font-display text-2xl text-gold-ink sm:text-3xl">
          <span
            className="inline-block h-4 w-4 border-2 border-gold-ink bg-gold sm:h-5 sm:w-5"
            aria-hidden
          />
          <span className="tabular-nums">{gold.toLocaleString()}</span>
          <span className="text-base sm:text-lg">G</span>
        </p>
      </div>

      {/* 전리품 */}
      <div className="border-t-2 border-ink pt-3">
        <div className="mb-2 flex items-baseline justify-between gap-2 font-display text-[11px] sm:text-xs">
          <span className="text-ink">전리품</span>
          <span className="tabular-nums text-ink-muted">{totalLoot}개</span>
        </div>

        {loot.length === 0 ? (
          <p className="text-xs text-ink-muted">
            의뢰를 완수하면 전리품이 이곳에 쌓입니다.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {loot.map((item) => (
              <li
                key={item.name}
                className="flex items-center gap-1.5 border-2 border-ink bg-tint-lavender px-2 py-1"
              >
                <span className="font-display text-[11px] text-cha">
                  {item.name}
                </span>
                {item.count > 1 && (
                  <span className="font-display text-[10px] tabular-nums text-ink-muted">
                    ×{item.count}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
