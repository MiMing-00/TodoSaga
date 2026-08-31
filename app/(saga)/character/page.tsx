'use client';

import { Character } from '@/app/components/Character';
import { NabiPanel } from '@/app/components/NabiPanel';
import { StreakStrip } from '@/app/components/StreakStrip';
import { equippedCosmetics } from '@/lib/inventory';
import { ashLevelFor, shadowLevelFor } from '@/lib/daily';
import { todayKey } from '@/lib/date';
import { levelFromExp } from '@/lib/quest';
import { activeStreak, useSagaStore } from '@/lib/store';

export default function CharacterPage() {
  const exp = useSagaStore((s) => s.exp);
  const stats = useSagaStore((s) => s.stats);
  const days = useSagaStore((s) => s.days);
  const gold = useSagaStore((s) => s.gold);
  const charClass = useSagaStore((s) => s.charClass);
  const classChanges = useSagaStore((s) => s.classChanges);
  const streak = useSagaStore((s) => s.streak);
  const bestStreak = useSagaStore((s) => s.bestStreak);
  const lastClearedDate = useSagaStore((s) => s.lastClearedDate);
  const inventory = useSagaStore((s) => s.inventory);
  const equipped = useSagaStore((s) => s.equipped);
  const changeClass = useSagaStore((s) => s.changeClass);
  const claimedStreaks = useSagaStore((s) => s.claimedStreaks);
  const claimStreak = useSagaStore((s) => s.claimStreak);
  const showToast = useSagaStore((s) => s.showToast);
  const affection = useSagaStore((s) => s.affection);
  const claimedAffection = useSagaStore((s) => s.claimedAffection);
  const petLog = useSagaStore((s) => s.petLog);
  const nabiFur = useSagaStore((s) => s.nabiFur);
  const nabiAccessory = useSagaStore((s) => s.nabiAccessory);
  const claimAffection = useSagaStore((s) => s.claimAffection);
  const dressNabi = useSagaStore((s) => s.dressNabi);
  const petNabi = useSagaStore((s) => s.petNabi);

  const today = todayKey();
  const shadowLevel = shadowLevelFor(lastClearedDate, today);
  const ashLevel = ashLevelFor(days, today);

  return (
    <>
      <h1 className="font-display text-lg text-ink sm:text-xl">▸ 캐릭터</h1>

      {/* 용사 카드가 주인공이다. 자질까지 카드 안에 담았으니 혼자서도
          할 말이 많다 — 옆에 나란히 세워 몸집을 반으로 줄일 이유가 없다 */}
      <Character
        stats={stats}
        level={levelFromExp(exp)}
        gold={gold}
        charClass={charClass}
        classChanges={classChanges}
        cosmetics={equippedCosmetics(inventory, equipped)}
        onChangeClass={changeClass}
        ashLevel={ashLevel}
      />

      {/* xl 미만은 그대로 쌓인다. xl 이상만 갈라진다 —
          매일 챙기는 불씨가 주, 나비와의 교감은 곁다리라 오른쪽 레일로 보낸다 */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
        <div className="min-w-0 flex-1">
          <StreakStrip
            streak={activeStreak(streak, lastClearedDate)}
            bestStreak={bestStreak}
            days={days}
            claimed={claimedStreaks}
            onClaim={(d) => {
              const label = claimStreak(d);
              if (label) showToast(`${d}일 보상 — ${label}`);
            }}
          />
        </div>

        <div className="xl:w-[320px] xl:shrink-0">
          <NabiPanel
            affection={affection}
            claimed={claimedAffection}
            petsToday={petLog.date === today ? petLog.count : 0}
            inventory={inventory}
            furId={nabiFur}
            accessoryId={nabiAccessory}
            onClaim={(at) => {
              const name = claimAffection(at);
              if (name) showToast(`나비와 ${name} 사이가 되었습니다`);
            }}
            onDress={dressNabi}
            onPet={() => petNabi(today)}
            shadowLevel={shadowLevel}
          />
        </div>
      </div>
    </>
  );
}
