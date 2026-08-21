'use client';

import { Character } from '@/app/components/Character';
import { NabiPanel } from '@/app/components/NabiPanel';
import { StatPanel } from '@/app/components/StatPanel';
import { StreakStrip } from '@/app/components/StreakStrip';
import { equippedCosmetics } from '@/lib/inventory';
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

  return (
    <>
      <h1 className="font-display text-lg text-ink sm:text-xl">▸ 캐릭터</h1>

      <Character
        stats={stats}
        level={levelFromExp(exp)}
        gold={gold}
        charClass={charClass}
        classChanges={classChanges}
        cosmetics={equippedCosmetics(inventory, equipped)}
        onChangeClass={changeClass}
      />

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

      <NabiPanel
        affection={affection}
        claimed={claimedAffection}
        petsToday={petLog.date === todayKey() ? petLog.count : 0}
        inventory={inventory}
        furId={nabiFur}
        accessoryId={nabiAccessory}
        onClaim={(at) => {
          const name = claimAffection(at);
          if (name) showToast(`나비와 ${name} 사이가 되었습니다`);
        }}
        onDress={dressNabi}
        onPet={() => petNabi(todayKey())}
      />

      <StatPanel stats={stats} />
    </>
  );
}
