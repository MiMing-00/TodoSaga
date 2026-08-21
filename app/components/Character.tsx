'use client';

import { CATEGORY, type Category } from '@/lib/quest';
import type { CosmeticArt } from '@/lib/cosmetics';
import {
  BODY_GRID,
  CLASSES,
  buildCharacterLayers,
  LOCKED_PALETTE,
  UNLOCK_STAT,
  classChangeCost,
  dominantClass,
  isClassUnlocked,
  titleFor,
} from '@/lib/sprite';
import type { Stats } from '@/lib/store';
import { useState } from 'react';
import { PixelButton } from './Pixel';
import { PixelSprite } from './PixelSprite';

type ClassKey = Category | 'NONE';
type View = 'idle' | 'info' | 'picker';

/**
 * 직업은 유저가 직접 고른다. 단, 첫 선택만 눈에 띄게 둔다.
 *
 * 재전직 입구를 카드에 대놓고 노출하면 앱이 "직업을 바꿔라"라고
 * 부추기는 것처럼 읽힌다. 이 앱이 유도해야 하는 행동은 전직이 아니라
 * 퀘스트를 쌓아 레벨을 올리는 것이므로, 재전직은 캐릭터 정보 안쪽에
 * 조용히 묻어둔다. (카드 → 캐릭터 정보 → 전향 → 확인)
 */
export function Character({
  stats,
  level,
  gold,
  charClass,
  classChanges,
  cosmetics = [],
  onChangeClass,
}: {
  stats: Stats;
  level: number;
  gold: number;
  charClass: ClassKey;
  classChanges: number;
  /** 장착 중인 치장. 캐릭터에 겹쳐 그린다 */
  cosmetics?: CosmeticArt[];
  onChangeClass: (key: Category) => void;
}) {
  const [view, setView] = useState<View>('idle');
  /** 고른 직후 바로 적용하지 않는다 — 되돌릴 수 없는 선택이라 한 번 더 묻는다 */
  const [pending, setPending] = useState<Category | null>(null);

  const cls = CLASSES[charClass];
  const dressed = buildCharacterLayers(charClass, cosmetics);
  const total = (Object.values(stats) as number[]).reduce((a, b) => a + b, 0);
  const dominant = dominantClass(stats);

  const isFirstChoice = charClass === 'NONE';
  const cost = isFirstChoice ? 0 : classChangeCost(classChanges);
  const affordable = gold >= cost;

  const share =
    charClass !== 'NONE' && total > 0
      ? Math.round(((stats[charClass] ?? 0) / total) * 100)
      : null;

  // 고른 직업과 실제 행동이 어긋난 경우에만 값이 들어간다
  const drift =
    charClass !== 'NONE' && dominant !== 'NONE' && dominant !== charClass
      ? dominant
      : null;

  const unlockedCount = (Object.values(CLASSES) as (typeof CLASSES)[ClassKey][])
    .filter((c) => c.key !== 'NONE' && isClassUnlocked(c.key, stats))
    .length;

  return (
    <div className="flex flex-col gap-4 border-[3px] border-ink bg-surface p-4 shadow-pixel sm:p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center border-2 border-ink bg-sunken sm:h-24 sm:w-24">
          <div className="animate-float">
            <PixelSprite
              layers={dressed.layers}
              palette={dressed.palette}
              size={72}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {!isFirstChoice && (
            <p className="font-display text-[11px] text-ink-muted sm:text-xs">
              {titleFor(level)}
            </p>
          )}
          <p className="mt-1 font-display text-lg leading-tight text-ink sm:text-xl">
            {cls.name}
          </p>

          <p className="mt-2 text-xs leading-relaxed break-keep text-ink-muted">
            {isFirstChoice ? (
              unlockedCount > 0 ? (
                `전직할 수 있는 직업이 ${unlockedCount}개 열렸어요.`
              ) : (
                `한 자질을 ${UNLOCK_STAT}까지 쌓으면 그 길이 열립니다.`
              )
            ) : share === null ? (
              '아직 완료한 퀘스트가 없어요.'
            ) : (
              <>
                <span className={CATEGORY[charClass].ink}>
                  {CATEGORY[charClass].name}
                </span>
                에 <span className="tabular-nums">{share}%</span>를 쏟고 있어요
              </>
            )}
          </p>
        </div>
      </div>

      {drift && (
        <p className="border-2 border-ink bg-tint-yellow px-2.5 py-1.5 text-xs leading-relaxed break-keep text-ink">
          요즘 발길이{' '}
          <span className={CATEGORY[drift].ink}>{CATEGORY[drift].name}</span>{' '}
          쪽으로 더 기울어 있습니다.
        </p>
      )}

      {/* 첫 선택만 눈에 띄는 버튼. 이후에는 조용한 정보 링크로 바뀐다. */}
      {isFirstChoice ? (
        <PixelButton
          variant="ghost"
          onClick={() => setView((v) => (v === 'picker' ? 'idle' : 'picker'))}
          className="w-full py-2 text-xs shadow-pixel-sm"
          aria-expanded={view === 'picker'}
        >
          {view === 'picker' ? '닫기' : '직업 정하기'}
        </PixelButton>
      ) : (
        <button
          type="button"
          onClick={() => setView((v) => (v === 'idle' ? 'info' : 'idle'))}
          aria-expanded={view !== 'idle'}
          className="self-start font-display text-[11px] text-ink-disabled underline underline-offset-4"
        >
          {view === 'idle' ? '캐릭터 정보' : '접기'}
        </button>
      )}

      {/* 캐릭터 정보 — 전직 입구는 이 안쪽 맨 아래에 묻어둔다 */}
      {view === 'info' && charClass !== 'NONE' && (
        <div className="flex flex-col gap-3 border-t-2 border-ink pt-4">
          <dl className="flex flex-col gap-1.5 font-display text-[11px] sm:text-xs">
            <Row label="칭호" value={titleFor(level)} />
            <Row label="직업" value={cls.name} />
            <Row
              label="몰두"
              value={
                share === null ? '-' : `${CATEGORY[charClass].name} ${share}%`
              }
            />
            <Row label="자질 총합" value={total.toLocaleString()} />
            <Row label="전직 횟수" value={`${classChanges}회`} />
          </dl>

          <div className="border-t-2 border-ink-disabled pt-3">
            <button
              type="button"
              onClick={() => setView('picker')}
              className="font-display text-[11px] text-ink-disabled underline underline-offset-4"
            >
              다른 길로 전향하기 →
            </button>
          </div>
        </div>
      )}

      {view === 'picker' && (
        <div className="flex flex-col gap-3 border-t-2 border-ink pt-4">
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {(Object.values(CLASSES) as (typeof CLASSES)[ClassKey][])
              // 한 번 길을 정하면 견습생으로는 돌아갈 수 없다. 잠긴 카드로
              // 남겨두면 '능력치가 모자라서 잠긴 것'처럼 읽히므로 아예 뺀다.
              .filter((c) => c.key !== 'NONE' || isFirstChoice)
              .map((c) => {
                const selected = c.key === charClass;
                const unlocked = isClassUnlocked(c.key, stats);
                const progress = c.key === 'NONE' ? 0 : (stats[c.key] ?? 0);

                return (
                  <li key={c.key}>
                    <button
                      type="button"
                      disabled={!unlocked || selected}
                      onClick={() => {
                        if (c.key !== 'NONE') setPending(c.key);
                      }}
                      aria-pressed={selected}
                      aria-label={
                        unlocked
                          ? c.name
                          : `${c.name} 잠김, ${progress} / ${UNLOCK_STAT}`
                      }
                      className={`press flex w-full flex-col items-center gap-1 border-2 p-1.5 ${
                        selected
                          ? 'border-primary bg-tint-lavender shadow-pixel-sm'
                          : unlocked
                            ? 'border-ink bg-surface'
                            : 'cursor-not-allowed border-ink-disabled bg-sunken'
                      }`}
                    >
                      <span className="relative flex h-11 w-11 items-center justify-center bg-sunken">
                        <PixelSprite
                          layers={[BODY_GRID, c.gear]}
                          palette={unlocked ? c.palette : LOCKED_PALETTE}
                          size={40}
                        />
                        {!unlocked && (
                          <span
                            className="absolute font-display text-sm text-ink-muted"
                            aria-hidden
                          >
                            ?
                          </span>
                        )}
                      </span>

                      <span
                        className={`font-display text-[10px] ${
                          selected
                            ? 'text-primary'
                            : unlocked
                              ? 'text-ink-muted'
                              : 'text-ink-disabled'
                        }`}
                      >
                        {unlocked ? c.name : '???'}
                      </span>

                      {!unlocked && (
                        <span className="font-display text-[9px] tabular-nums text-ink-disabled">
                          {progress}/{UNLOCK_STAT}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
          </ul>

          <p className="text-xs leading-relaxed break-keep text-ink-muted">
            해당 자질을 {UNLOCK_STAT}까지 쌓으면 그 길이 열립니다.
            {isFirstChoice ? (
              <> 첫 전직은 무료지만, 되돌릴 수 없습니다.</>
            ) : (
              <>
                {' '}
                다른 길로 옮기려면{' '}
                <span className="font-display text-gold-ink tabular-nums">
                  {cost.toLocaleString()} G
                </span>
                가 듭니다.
              </>
            )}
          </p>

          {!isFirstChoice && (
            <button
              type="button"
              onClick={() => setView('info')}
              className="self-start font-display text-[11px] text-ink-disabled underline underline-offset-4"
            >
              ← 돌아가기
            </button>
          )}
        </div>
      )}

      {pending && (
        <ClassConfirm
          target={pending}
          isFirstChoice={isFirstChoice}
          cost={cost}
          gold={gold}
          affordable={affordable}
          nextCost={classChangeCost(isFirstChoice ? 0 : classChanges + 1)}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            onChangeClass(pending);
            setPending(null);
            setView('idle');
          }}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="tabular-nums text-ink">{value}</dd>
    </div>
  );
}

/**
 * 운명의 선택 패널.
 * 삭제 확인은 인라인으로 처리했지만 전직은 다르다 —
 * 되돌릴 수 없고 값이 비싸므로, 흐름을 끊는 게 오히려 맞다.
 */
function ClassConfirm({
  target,
  isFirstChoice,
  cost,
  gold,
  affordable,
  nextCost,
  onCancel,
  onConfirm,
}: {
  target: Category;
  isFirstChoice: boolean;
  cost: number;
  gold: number;
  affordable: boolean;
  nextCost: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cls = CLASSES[target];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 디더 스크림 — 흐림(blur) 대신 체크무늬로 가린다 */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onCancel}
        className="absolute inset-0 cursor-default"
        style={{
          backgroundImage:
            'repeating-conic-gradient(#2E2A24 0% 25%, rgba(0,0,0,0) 0% 50%)',
          backgroundSize: '4px 4px',
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="전직 확인"
        className="relative w-full max-w-sm border-[3px] border-ink bg-surface shadow-pixel"
      >
        <header className="border-b-[3px] border-ink bg-ink px-3 py-2 text-center">
          <p className="animate-blink font-display text-[13px] text-canvas">
            ⚠ 운명의 선택 ⚠
          </p>
        </header>

        <div className="flex flex-col items-center gap-4 p-5">
          <div className="flex h-24 w-24 items-center justify-center border-[3px] border-ink bg-sunken shadow-pixel-sm">
            <div className="animate-float">
              <PixelSprite
                layers={[BODY_GRID, cls.gear]}
                palette={cls.palette}
                size={80}
              />
            </div>
          </div>

          <p className="font-display text-2xl text-ink">{cls.name}</p>

          <p className="text-center text-xs leading-relaxed break-keep text-ink-muted">
            {isFirstChoice ? (
              <>
                이 길을 선택하면 <b className="text-ink">되돌릴 수 없습니다.</b>
                <br />
                다음에 다른 길로 옮기려면{' '}
                <span className="font-display text-gold-ink tabular-nums">
                  {nextCost.toLocaleString()} G
                </span>
                가 듭니다.
              </>
            ) : (
              <>
                지금까지 걸어온 길을 버리고 옮깁니다.
                <br />
                능력치와 전리품은 그대로 남습니다.
              </>
            )}
          </p>

          {!isFirstChoice && (
            <div className="w-full border-2 border-ink bg-sunken px-3 py-2 font-display text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-ink-muted">전직 비용</span>
                <span className="tabular-nums text-gold-ink">
                  -{cost.toLocaleString()} G
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <span className="text-ink-muted">소지금</span>
                <span
                  className={`tabular-nums ${affordable ? 'text-ink' : 'text-danger'}`}
                >
                  {gold.toLocaleString()} G
                </span>
              </div>
              {!affordable && (
                <p className="mt-2 border-t-2 border-ink-disabled pt-2 text-[11px] text-danger">
                  {(cost - gold).toLocaleString()} G 부족합니다.
                </p>
              )}
            </div>
          )}

          <div className="flex w-full flex-col gap-2 sm:flex-row-reverse">
            <PixelButton
              onClick={onConfirm}
              disabled={!affordable}
              className="flex-1 py-2.5 text-sm"
            >
              이 길을 걷는다
            </PixelButton>
            <PixelButton
              variant="ghost"
              onClick={onCancel}
              className="flex-1 py-2.5 text-sm"
            >
              돌아가기
            </PixelButton>
          </div>
        </div>
      </div>
    </div>
  );
}
