'use client';

/**
 * 소지품 — 모은 재화를 확인하는 곳.
 * 골드는 크게 보여주고, 지금까지 화면에서 스쳐 지나가기만 하던
 * 퀘스트 전리품(rewards.loot)을 여기에 모아 쌓는다.
 *
 * 세로로 긴 박스로 두면 봇짐 옆(또는 위)에 또 하나의 카드가 쌓이는
 * 모양이 된다. 여긴 숫자와 태그 몇 개뿐이라 그럴 무게가 없다 — 가로
 * 배너 한 줄로 접어서, 아래 봇짐이 화면의 주인공이 되게 비켜준다.
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
    <div className="flex flex-col gap-3 border-[3px] border-ink bg-surface p-4 shadow-pixel sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      {/* 골드 */}
      <div className="flex shrink-0 items-baseline gap-2.5">
        <p className="font-display text-[11px] text-ink-muted sm:text-xs">
          여비
        </p>
        <p className="flex items-center gap-1.5 font-display text-2xl text-gold-ink sm:text-3xl">
          <span
            className="inline-block h-4 w-4 border-2 border-gold-ink bg-gold sm:h-5 sm:w-5"
            aria-hidden
          />
          <span className="tabular-nums">{gold.toLocaleString()}</span>
          <span className="text-base sm:text-lg">G</span>
        </p>
      </div>

      {/* 전리품 */}
      <div className="min-w-0 flex-1 border-t-2 border-ink pt-3 sm:border-t-0 sm:border-l-2 sm:pt-0 sm:pl-5">
        <div className="mb-1.5 flex items-baseline gap-2 font-display text-[11px] sm:text-xs">
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
