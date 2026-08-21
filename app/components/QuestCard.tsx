'use client';

import { NO_BONUS, type Bonus } from '@/lib/inventory';
import { CATEGORY, RANK, type Quest } from '@/lib/quest';
import { useEffect, useRef, useState } from 'react';
import { Chip, PixelButton } from './Pixel';

export function QuestCard({
  quest,
  bonus = NO_BONUS,
  rerollCost,
  rerolling = false,
  registered = false,
  onComplete,
  onRemove,
  onReroll,
  onRegister,
}: {
  quest: Quest;
  /** 장착 장비 보너스. 카드에는 '실제로 받게 될 값'을 보여준다 */
  bonus?: Bonus;
  rerollCost: number;
  rerolling?: boolean;
  /** 이미 상시 의뢰로 등록돼 있는가 */
  registered?: boolean;
  onComplete: (note?: string) => void;
  onRemove: () => void;
  onReroll: () => void;
  onRegister: () => void;
}) {
  const cat = CATEGORY[quest.category] ?? CATEGORY.STR;
  const rank = RANK[quest.rank] ?? RANK.F;
  const done = quest.completed;

  const gainExp = Math.round(quest.rewards.exp * bonus.expMult);
  const gainGold = Math.round(quest.rewards.gold * bonus.goldMult);
  const expBoosted = gainExp > quest.rewards.exp;
  const goldBoosted = gainGold > quest.rewards.gold;
  const expReduced = gainExp < quest.rewards.exp;

  // 브라우저 confirm 대신 인라인 2단계 확인 — 모달은 픽셀 UI의 흐름을 끊는다
  const [confirming, setConfirming] = useState(false);

  /**
   * 완수는 두 걸음이다.
   *
   * 한 번에 끝나면 완료 버튼이 **누르는 행위 자체**를 보상하게 된다.
   * 한 줄을 적을 자리를 두면 자기기만이 조금 어려워지고,
   * 그 한 줄이 사가의 서에 남아 회고가 된다. 적지 않고 넘어갈 수도 있다.
   */
  const [noting, setNoting] = useState(false);
  const [note, setNote] = useState('');
  const [celebrating, setCelebrating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function finish(withNote: boolean) {
    setNoting(false);
    setCelebrating(true);
    onComplete(withNote ? note : undefined);
    setNote('');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCelebrating(false), 700);
  }

  return (
    <article
      className={`relative ${
        celebrating ? 'animate-enhance-flash border-2 border-exp' : ''
      } ${
        done
          ? 'animate-pop-in border-2 border-ink-disabled bg-tint-gray'
          : `animate-pop-in bg-surface shadow-pixel ${rank.border}`
      }`}
    >
      {/* 얻은 것이 위로 떠오른다 */}
      {celebrating && (
        <span
          className="animate-gain-rise pointer-events-none absolute top-3 right-4 z-10 flex flex-col items-end gap-1 font-display text-sm"
          aria-hidden
        >
          <span className="text-exp">+{gainExp} EXP</span>
          <span className="text-gold-ink">+{gainGold} G</span>
        </span>
      )}
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        {/* 랭크 배지 + 제목 + 카테고리 */}
        <div className="flex items-start gap-3">
          <div
            className={
              done
                ? 'flex h-10 w-10 shrink-0 items-center justify-center border-2 border-ink-disabled bg-sunken font-display text-lg text-ink-disabled sm:h-11 sm:w-11 sm:text-xl'
                : `flex h-10 w-10 shrink-0 items-center justify-center font-display text-lg sm:h-11 sm:w-11 sm:text-xl ${rank.badge}`
            }
            aria-label={`랭크 ${quest.rank}`}
          >
            {quest.rank}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <h3
                className={`min-w-0 flex-1 font-display text-base leading-snug break-keep sm:text-lg ${
                  done ? 'text-ink-disabled line-through' : 'text-ink'
                }`}
              >
                {quest.title}
              </h3>

              {/* 매일 하는 일이라면 상시 의뢰로 걸어둔다 */}
              {!done && (
                <button
                  type="button"
                  onClick={onRegister}
                  disabled={registered}
                  aria-label={registered ? '이미 상시 의뢰' : '상시 의뢰로 등록'}
                  title={registered ? '이미 상시 의뢰예요' : '상시 의뢰로 등록'}
                  className={`press shrink-0 border-2 px-1.5 py-0.5 font-display text-[10px] ${
                    registered
                      ? 'border-primary bg-tint-lavender text-primary'
                      : 'border-ink-disabled bg-surface text-ink-muted'
                  }`}
                >
                  ↻
                </button>
              )}

              {done ? null : confirming ? (
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={onRemove}
                    className="press border-2 border-danger bg-surface px-1.5 py-0.5 font-display text-[10px] text-danger"
                  >
                    삭제
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="press border-2 border-ink-disabled bg-surface px-1.5 py-0.5 font-display text-[10px] text-ink-muted"
                  >
                    취소
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  aria-label="퀘스트 포기"
                  className="press shrink-0 border-2 border-ink-disabled bg-surface px-1.5 py-0.5 font-display text-[10px] text-ink-muted"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Chip
                className={
                  done
                    ? 'border-ink-disabled bg-sunken text-ink-disabled'
                    : `border-ink ${cat.tint} ${cat.ink}`
                }
              >
                <span aria-hidden>{cat.icon}</span>
                {cat.name}
              </Chip>
              <Chip
                className={
                  done
                    ? 'border-ink-disabled bg-sunken text-ink-disabled'
                    : 'border-ink bg-tint-mint text-exp'
                }
              >
                +{gainExp} EXP
                {expBoosted && !done && (
                  <span className="text-primary" aria-label="장비 효과 적용">
                    ▲
                  </span>
                )}
                {expReduced && !done && (
                  <span
                    className="text-danger"
                    aria-label={`어제 놓친 퀘스트로 ${bonus.debuffPercent}% 감소`}
                  >
                    ▼
                  </span>
                )}
              </Chip>
              <Chip
                className={
                  done
                    ? 'border-ink-disabled bg-sunken text-ink-disabled'
                    : 'border-ink bg-tint-yellow text-gold-ink'
                }
              >
                +{gainGold} G
                {goldBoosted && !done && (
                  <span className="text-primary" aria-label="장비 효과 적용">
                    ▲
                  </span>
                )}
              </Chip>
            </div>
          </div>
        </div>

        {/* 예상 소요 시간 — 「시간의 모래시계」 */}
        {quest.estimated_minutes != null && (
          <Chip
            className={
              done
                ? 'self-start border-ink-disabled bg-sunken text-ink-disabled'
                : 'self-start border-ink bg-tint-peach text-luk'
            }
          >
            <span aria-hidden>⧗</span> 약 {quest.estimated_minutes}분
          </Chip>
        )}

        {/* 목표 */}
        <p
          className={`border-l-[3px] pl-3 text-sm leading-relaxed break-keep ${
            done
              ? 'border-ink-disabled text-ink-disabled'
              : 'border-ink text-ink'
          }`}
        >
          {quest.objective}
        </p>

        {/* 처음 5분 — 「첫걸음의 신발」. 미루기의 대부분은 시작이 막막해서다 */}
        {quest.first_step && (
          <div
            className={`flex items-start gap-2 border-2 px-2.5 py-1.5 ${
              done
                ? 'border-ink-disabled bg-sunken'
                : 'border-ink bg-tint-mint'
            }`}
          >
            <span className="shrink-0 font-display text-[11px] text-exp">
              첫 걸음
            </span>
            <span
              className={`min-w-0 flex-1 text-[13px] leading-relaxed break-keep ${
                done ? 'text-ink-disabled' : 'text-ink'
              }`}
            >
              {quest.first_step}
            </span>
          </div>
        )}

        {/* 도구가 덧붙인 부가 정보 */}
        {quest.tips && quest.tips.length > 0 && (
          <ul
            className={`flex flex-col gap-1 border-l-[3px] pl-3 ${
              done ? 'border-ink-disabled' : 'border-int'
            }`}
          >
            {quest.tips.map((tip, i) => (
              <li
                key={i}
                className={`text-[13px] leading-relaxed break-keep ${
                  done ? 'text-ink-disabled' : 'text-ink-muted'
                }`}
              >
                · {tip}
              </li>
            ))}
          </ul>
        )}

        {/* 나비의 한마디 */}
        {quest.flavor_text && (
          <p
            className={`text-[13px] leading-relaxed break-keep italic ${
              done ? 'text-ink-disabled' : 'text-ink-muted'
            }`}
          >
            🦋 {quest.flavor_text}
          </p>
        )}

        {/* 보상 & 실패 페널티 */}
        {!done && (
          <div className="flex flex-col gap-2">
            {quest.rewards.loot && (
              <div className="flex items-start gap-2 border-2 border-ink bg-tint-lavender px-2.5 py-1.5">
                <span className="font-display text-[11px] text-cha">보상</span>
                <span className="min-w-0 flex-1 text-[13px] break-keep text-ink">
                  {quest.rewards.loot}
                </span>
              </div>
            )}
            {quest.debuff && (
              <div className="flex items-start gap-2 border-2 border-danger bg-surface px-2.5 py-1.5">
                <span className="font-display text-[11px] text-danger">대가</span>
                <span className="min-w-0 flex-1 text-[13px] break-keep text-ink-muted">
                  {quest.debuff}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 무엇을 했는지 한 줄. 건너뛸 수 있다 */}
        {noting && !done && (
          <div className="flex flex-col gap-2 border-2 border-exp bg-tint-mint p-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-display text-[11px] text-exp">
                무엇을 했나요?
              </span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finish(true);
                  if (e.key === 'Escape') setNoting(false);
                }}
                placeholder="스쿼트 3세트, 마지막 세트는 겨우 했다"
                autoFocus
                className="w-full border-2 border-ink bg-surface px-2.5 py-2 text-sm text-ink placeholder:text-ink-disabled focus:border-primary focus:outline-none focus-visible:outline-none"
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <PixelButton
                variant="success"
                onClick={() => finish(true)}
                disabled={!note.trim()}
                className="flex-1 py-2 text-xs"
              >
                남기고 완수
              </PixelButton>
              <PixelButton
                variant="ghost"
                onClick={() => finish(false)}
                className="flex-1 py-2 text-xs"
              >
                그냥 완수
              </PixelButton>
            </div>
          </div>
        )}

        {/* 남긴 한 줄 */}
        {done && quest.note && (
          <p className="border-l-[3px] border-exp pl-3 text-[13px] leading-relaxed break-keep text-ink-muted">
            “{quest.note}”
          </p>
        )}

        {/* 액션 */}
        {done ? (
          <div className="flex items-center gap-2 border-t-2 border-ink-disabled pt-3 font-display text-xs text-ink-disabled">
            <span aria-hidden>✔</span> 완수한 의뢰
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row-reverse sm:items-center sm:justify-start">
            <PixelButton
              variant="success"
              onClick={() => setNoting(true)}
              disabled={rerolling}
              className="w-full py-2.5 text-sm sm:w-auto sm:px-6"
            >
              완수
            </PixelButton>

            {/* 마음에 안 드는 퀘스트를 지우는 것 말고 다른 선택지 */}
            <PixelButton
              variant="ghost"
              onClick={onReroll}
              disabled={rerolling}
              className="w-full py-2.5 text-[11px] shadow-pixel-sm sm:w-auto sm:px-4"
            >
              {rerolling ? (
                <span className="animate-blink">고쳐 쓰는 중...</span>
              ) : (
                <>다시 받기 {rerollCost} G</>
              )}
            </PixelButton>
          </div>
        )}
      </div>
    </article>
  );
}
