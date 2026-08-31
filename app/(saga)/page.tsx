'use client';

import { generateQuests, rerollQuest } from '@/app/actions/quest';
import { Chip, Panel, PixelButton, SegmentGauge } from '@/app/components/Pixel';
import { QuestCard } from '@/app/components/QuestCard';
import { QuestScrollOverlay, type ScrollPhase } from '@/app/components/QuestScrollOverlay';
import { LoreTip } from '@/app/components/LoreTip';
import { Routines } from '@/app/components/Routines';
import { activeDebuffPercent } from '@/lib/daily';
import { formatKorean, shiftDay, todayKey } from '@/lib/date';
import { computeBonus, withDebuff } from '@/lib/inventory';
import { getItem } from '@/lib/items';
import { CATEGORY, levelFromExp } from '@/lib/quest';
import { PixelSprite } from '@/app/components/PixelSprite';
import { Wordmark } from '@/app/components/Wordmark';
import { isRegistered } from '@/lib/routine';
import { REROLL_COST } from '@/lib/shop';
import { NABI, NABI_PALETTE, CLASSES, UNLOCK_STAT } from '@/lib/sprite';
import { activeStreak, useSagaStore } from '@/lib/store';
import { useState } from 'react';

export default function QuestPage() {
  const job = useSagaStore((s) => s.job);
  const exp = useSagaStore((s) => s.exp);
  const stats = useSagaStore((s) => s.stats);
  const days = useSagaStore((s) => s.days);
  const inventory = useSagaStore((s) => s.inventory);
  const equipped = useSagaStore((s) => s.equipped);
  const debuff = useSagaStore((s) => s.debuff);
  const streak = useSagaStore((s) => s.streak);
  const lastClearedDate = useSagaStore((s) => s.lastClearedDate);
  const setJob = useSagaStore((s) => s.setJob);
  const addQuests = useSagaStore((s) => s.addQuests);
  const completeQuest = useSagaStore((s) => s.completeQuest);
  const removeQuest = useSagaStore((s) => s.removeQuest);
  const showToast = useSagaStore((s) => s.showToast);
  const clearDrop = useSagaStore((s) => s.clearDrop);
  const payReroll = useSagaStore((s) => s.payReroll);
  const replaceQuest = useSagaStore((s) => s.replaceQuest);
  const routines = useSagaStore((s) => s.routines);
  const addRoutine = useSagaStore((s) => s.addRoutine);
  const removeRoutine = useSagaStore((s) => s.removeRoutine);
  const toggleRoutineDay = useSagaStore((s) => s.toggleRoutineDay);
  const summonRoutines = useSagaStore((s) => s.summonRoutines);

  const [userInput, setUserInput] = useState('');
  const [rerollingIndex, setRerollingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scrollPhase, setScrollPhase] = useState<ScrollPhase | null>(null);
  const [scrollCount, setScrollCount] = useState(0);

  const today = todayKey();
  const quests = days[today] ?? [];
  const level = levelFromExp(exp);
  const debuffPercent = activeDebuffPercent(debuff, today);

  const doneCount = quests.filter((q) => q.completed).length;
  const allDone = quests.length > 0 && doneCount === quests.length;

  // 오늘 의뢰가 비어 있는 순간이 실은 가장 자주 보는 화면이다.
  // 빈 칸을 채우려고 지어내지 않고, 어제 남긴 기록과 이어온 불씨로 채운다
  const yesterdayQuests = days[shiftDay(today, -1)] ?? [];
  const liveStreak = activeStreak(streak, lastClearedDate);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!job.trim()) {
      setError('생업을 알려주셔야 나비가 의뢰서를 씁니다.');
      return;
    }
    setLoading(true);
    setError('');
    setScrollPhase('writing');

    // 장착 중인 도구가 AI에게 추가 지시를 넣는다 — 이 앱의 핵심 가치
    const toolIds = (equipped.tools ?? [])
      .map((uid) => inventory.find((o) => o.uid === uid)?.itemId)
      .filter((id): id is string => Boolean(id));

    const result = await generateQuests(userInput, job, toolIds);

    if (result.error) {
      setError(result.error);
      setScrollPhase(null);
    } else if (result.quests) {
      addQuests(today, result.quests);
      setUserInput('');
      setScrollCount(result.quests.length);
      setScrollPhase('unfurl');
    } else {
      setScrollPhase(null);
    }
    setLoading(false);
  }

  function handleComplete(index: number, note?: string) {
    const quest = quests[index];
    if (!quest || quest.completed) return;

    // 연출은 '완료'라는 사건에 붙인다. 해금이 레벨업보다 드무므로 우선한다
    const statBefore = stats[quest.category] ?? 0;
    const statAfter = statBefore + quest.rewards.exp;
    const nextLevel = levelFromExp(exp + quest.rewards.exp);

    if (statBefore < UNLOCK_STAT && statAfter >= UNLOCK_STAT) {
      showToast(`새로운 길이 열렸습니다 — ${CLASSES[quest.category].name}`);
    } else if (nextLevel > level) {
      showToast(`용사의 격이 올랐습니다 — LV.${nextLevel}`);
    }

    completeQuest(today, index, note);

    // 드랍이 있었으면 그걸 먼저 알린다 — 레벨업보다 드문 사건이다
    const drop = useSagaStore.getState().lastDrop;
    if (drop) {
      const item = getItem(drop);
      if (item) showToast(`전리품 — ${item.name}`);
      clearDrop();
    }
  }

  async function handleReroll(index: number) {
    const quest = quests[index];
    if (!quest || quest.completed || rerollingIndex !== null) return;

    // 골드를 먼저 차감한다. 실패하면 되돌린다
    if (!payReroll()) {
      setError(`여비가 모자랍니다. 다시 받으려면 ${REROLL_COST} G가 필요해요.`);
      return;
    }

    setRerollingIndex(index);
    setError('');

    const toolIds = (equipped.tools ?? [])
      .map((uid) => inventory.find((o) => o.uid === uid)?.itemId)
      .filter((id): id is string => Boolean(id));

    const result = await rerollQuest(
      { title: quest.title, objective: quest.objective },
      job,
      toolIds,
    );

    if (result.quest) replaceQuest(today, index, result.quest);
    else setError(result.error ?? '나비가 다시 쓰지 못했어요.');

    setRerollingIndex(null);
  }

  return (
    <>
      {scrollPhase && (
        <QuestScrollOverlay
          phase={scrollPhase}
          questCount={scrollCount}
          onUnfurled={() => setScrollPhase('success')}
          onDone={() => setScrollPhase(null)}
        />
      )}

      <div>
        <h1 className="sm:hidden">
          <Wordmark size="lg" />
        </h1>
        {/* 날짜 옆에는 **오늘에 관한 것만** 적는다.
            생업은 매일 바뀌는 값이 아니므로 설정으로 옮겼다 */}
        <p className="mt-3 font-display text-[11px] text-ink-muted sm:mt-0 sm:text-sm sm:text-ink">
          {formatKorean(today)}
          {quests.length > 0 && (
            <span className="text-ink-muted">
              {' · '}
              <span className="tabular-nums">
                {doneCount}/{quests.length}
              </span>{' '}
              완수
            </span>
          )}
        </p>

        {/* 오늘의 여정 게이지 — 따로 창을 하나 더 열 만큼 무겁지 않다.
            날짜 밑에 바로 붙여서 훑을 때 한 덩어리로 읽히게 한다 */}
        {quests.length > 0 && (
          <div className="mt-3">
            <SegmentGauge
              value={doneCount}
              max={quests.length}
              segments={Math.min(quests.length, 12)}
              fill="bg-primary"
            />
            <p className="mt-2 text-[11px] text-ink-muted sm:text-xs">
              {allDone
                ? '오늘 몫의 의뢰를 모두 완수했습니다. 나비가 흐뭇해하네요.'
                : `아직 ${quests.length - doneCount}건이 남았어요. 한 걸음씩이면 됩니다.`}
            </p>
          </div>
        )}
      </div>

      {debuffPercent > 0 && (
        <p className="border-2 border-danger bg-surface px-3 py-2 font-display text-[11px] leading-relaxed break-keep text-danger">
          어제 놓친 의뢰가{' '}
          <LoreTip hint="용사가 만드는 게 아니라, 방치된 자리에 저절로 스며드는 낡음. 무기로는 벨 수 없고, 오늘의 불씨로만 밀려난다.">
            녹
          </LoreTip>
          으로 남았습니다. 오늘 하루 EXP가 {debuffPercent}%
          줄어듭니다.
          <span className="mt-1 block text-ink-muted">
            불씨는 그대로예요. 오늘 다시 채우면 됩니다.
          </span>
        </p>
      )}

      <Routines
        routines={routines}
        today={today}
        todayQuests={quests}
        onSummon={() => {
          const added = summonRoutines(today);
          if (added > 0) showToast(`상시 의뢰 ${added}건을 받아왔습니다`);
        }}
        onToggleDay={toggleRoutineDay}
        onRemove={removeRoutine}
      />

      {/* 폼과 목록은 무게가 다르다 — 폼은 채우고 나면 끝이고, 목록이 오늘의 진짜 콘텐츠다.
          xl 미만은 지금처럼 위아래로 쌓이고, xl 이상만 좁은 폼 · 넓은 목록으로 갈라진다 */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
        <div className="xl:w-[360px] xl:shrink-0">
          <Panel title="나비에게 의뢰하기">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* 생업은 한 번 적으면 바뀌지 않는다. 매일 보는 폼에 둘 값이 아니다.
                  비어 있을 때만 여기서 채우게 하고, 그 뒤로는 설정에서 고친다 */}
              {!job.trim() && (
                <Field label="현실의 생업" hint="한 번만 적으면 됩니다. 나중에 설정에서 고칠 수 있어요">
                  <input
                    type="text"
                    value={job}
                    onChange={(e) => setJob(e.target.value)}
                    placeholder="개발자, 학생, 디자이너..."
                    className={inputStyle}
                    required
                    disabled={loading}
                  />
                </Field>
              )}

              <Field label="오늘 해야 할 일">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="회의 준비하고, 운동하고, 블로그 글 하나 쓸 거야"
                  className={`${inputStyle} resize-none`}
                  rows={4}
                  required
                  disabled={loading}
                />
              </Field>

              {error && (
                <p className="border-2 border-danger bg-surface px-3 py-2 font-display text-[11px] text-danger">
                  ! {error}
                </p>
              )}

              <PixelButton type="submit" disabled={loading} className="w-full py-3 text-sm">
                {loading ? (
                  <span className="animate-blink">나비가 받아적는 중...</span>
                ) : (
                  '의뢰서 받기'
                )}
              </PixelButton>
            </form>
          </Panel>
        </div>

        <div className="min-w-0 flex-1">
          <Panel
            title="오늘의 의뢰"
            right={
              <span className="font-display text-[10px] tabular-nums text-canvas/70">
                {quests.length}건
              </span>
            }
          >
            <div className="flex flex-col gap-4">
            {/* 의뢰가 없는 날은 이 자리가 페이지의 전부다.
                짧은 채로 두면 밑에 빈 화면만 남으니, 하루가 시작되길
                기다리는 자리답게 넉넉히 차지하게 한다 */}
            {quests.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-6 border-[3px] border-dashed border-ink-disabled bg-surface/60 px-6 py-8 text-center sm:min-h-[400px] xl:min-h-[480px]">
                <div>
                  <div className="animate-float mb-4 flex justify-center">
                    <PixelSprite
                      layers={[NABI]}
                      palette={NABI_PALETTE}
                      size={56}
                    />
                  </div>
                  {/* 불씨가 이어지고 있으면 그 얘기부터 — 매일 같은 대사보다
                      "지금 이 용사"에 대한 말이 나비다워진다 */}
                  <p className="font-display text-xs leading-relaxed text-ink-muted sm:text-sm">
                    {liveStreak > 0 ? (
                      <>
                        <span className="text-ink">{liveStreak}일째</span> 불씨를
                        이어가고 있어요.
                        <br />
                        오늘 몫도 나비에게 들려주세요.
                      </>
                    ) : (
                      <>
                        나비가 앞발을 모으고 기다리고 있어요.
                        <br />
                        오늘 해야 할 일을 들려주세요.
                      </>
                    )}
                  </p>
                </div>

                {/* 어제 기록이 있으면 살짝 곁들인다 — 빈 화면이 아니라
                    "이어지는 하루" 사이의 쉼표로 읽히게 */}
                {yesterdayQuests.length > 0 && (
                  <div className="w-full max-w-xs border-t-2 border-dashed border-ink-disabled pt-4">
                    <p className="mb-2 font-display text-[10px] text-ink-disabled">
                      어제 남긴 기록
                    </p>
                    <ul className="flex flex-col gap-1.5 text-left">
                      {yesterdayQuests.slice(0, 3).map((quest, i) => {
                        const cat = CATEGORY[quest.category] ?? CATEGORY.STR;
                        return (
                          <li
                            key={`${quest.title}-${i}`}
                            className="flex items-center gap-1.5"
                          >
                            <Chip
                              className={
                                quest.completed
                                  ? 'border-ink bg-sunken text-ink-muted'
                                  : 'border-ink-disabled bg-sunken text-ink-disabled'
                              }
                            >
                              <span aria-hidden>{cat.icon}</span>
                            </Chip>
                            <span
                              className={`truncate text-[11px] ${
                                quest.completed
                                  ? 'text-ink-muted'
                                  : 'text-ink-disabled line-through'
                              }`}
                            >
                              {quest.title}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              quests.map((quest, index) => (
                <QuestCard
                  key={`${quest.title}-${index}`}
                  quest={quest}
                  bonus={withDebuff(
                    computeBonus(inventory, equipped, quest.category),
                    debuffPercent,
                  )}
                  rerollCost={REROLL_COST}
                  rerolling={rerollingIndex === index}
                  registered={isRegistered(routines, quest)}
                  onComplete={(note) => handleComplete(index, note)}
                  onRemove={() => removeQuest(today, index)}
                  onReroll={() => handleReroll(index)}
                  onRegister={() => {
                    addRoutine(quest);
                    showToast(`상시 의뢰로 걸었습니다 — ${quest.title}`);
                  }}
                />
              ))
            )}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

const inputStyle =
  'w-full border-[3px] border-ink bg-sunken px-3 py-2.5 text-sm text-ink placeholder:text-ink-disabled focus:border-primary focus:outline-none focus-visible:outline-none disabled:text-ink-disabled';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-[11px] text-ink-muted sm:text-xs">
          {label}
        </span>
        {hint && <span className="text-[11px] text-ink-disabled">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
