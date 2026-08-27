'use client';

import { PET_LIMIT, affectionName, buildNabi } from '@/lib/nabi';
import {
  NABI,
  NABI_DOZE,
  NABI_GROOM,
  NABI_CLEAN_A,
  NABI_CLEAN_B,
  NABI_CROUCH,
  NABI_JUMP_DOWN,
  NABI_JUMP_UP,
  NABI_SIDE_A,
  NABI_SIDE_B,
  NABI_SLEEP,
  NABI_STRETCH,
  NABI_STUDY_A,
  NABI_STUDY_B,
  NABI_STUDY_C,
  NABI_STUDY_D,
  type Grid,
} from '@/lib/sprite';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { todayKey } from '@/lib/date';
import {
  NABI_ASH_LINES,
  NABI_LIMIT_LINES,
  NABI_LINES,
  NABI_SHADOW_LINES,
  pickLine,
  type NabiMode,
} from './nabiLines';
import { PixelSprite } from './PixelSprite';
import { ShadowBlotch } from './ShadowBlotch';

/**
 * 배경을 거니는 나비.
 *
 * 넓은 화면에는 내용 바깥으로 남는 공간이 크다. 그 여백에 나비가 산다.
 * **좁은 화면에는 두지 않는다** — 여백이 없어서 내용을 가리기만 한다.
 * (좁은 화면에서는 캐릭터 탭의 나비를 직접 쓰다듬는다)
 *
 * 몇 가지를 지킨다.
 * - 걸을 때는 **옆모습 두 프레임**으로 다리를 움직인다. 앞모습이 미끄러지면 인형이다
 * - **대각선으로 미끄러지지 않는다.** 한 높이에서 수평으로 걷다가,
 *   높이를 바꿀 때만 **점프**로 건너뛴다. 위로도 아래로도 점프한다.
 *   비스듬히 흐르는 픽셀은 떠다니는 것처럼 보여 불쾌하다
 * - 점프에도 **좌·우 방향**이 있다. 걷기와 마찬가지로 가는 쪽을 본다
 * - **내용 패널 뒤로 지나간다.** 패널이 위(z-30)라 가려지고, 가려진 동안엔 만질 수도 없다
 */
/** 두 프레임 이상 자세는 차례로 재생한다 */
/**
 * 공부는 대부분 펼쳐 둔 채(A) 읽고, 가끔만 B→C→D로 장을 넘긴다.
 * A를 여러 번 넣어 리듬을 만든다 — 매 틱 넘기면 책이 발작한다.
 */
const STUDY_CYCLE: Grid[] = [
  NABI_STUDY_A,
  NABI_STUDY_A,
  NABI_STUDY_A,
  NABI_STUDY_A,
  NABI_STUDY_A,
  NABI_STUDY_B,
  NABI_STUDY_C,
  NABI_STUDY_D,
  NABI_STUDY_A,
  NABI_STUDY_A,
];

const ANIMATED: Partial<Record<NabiMode, Grid[]>> = {
  walk: [NABI_SIDE_A, NABI_SIDE_B],
  study: STUDY_CYCLE,
  clean: [NABI_CLEAN_A, NABI_CLEAN_B],
};

const STILL: Record<'sit' | 'groom' | 'doze' | 'sleep' | 'stretch', Grid> = {
  sit: NABI,
  groom: NABI_GROOM,
  doze: NABI_DOZE,
  sleep: NABI_SLEEP,
  stretch: NABI_STRETCH,
};

const STEP = 5;
const TICK = 240;
/**
 * 이만큼(틱) 아무 일도 없으면 존다.
 * 너무 자주 자면 배경에 죽은 고양이가 있는 꼴이라, 일과를 먼저 돌게 두고
 * 그래도 할 일이 없을 때만 눕힌다.
 */
const DOZE_AFTER = 40;
const SLEEP_AFTER = 66;
/** 이만큼 자면 스스로 깨어난다. 안 그러면 영영 안 일어난다 */
const WAKE_AFTER = 75;

/**
 * 걷다가 딴짓으로 새는 확률(틱당)과, 샜을 때 무엇을 하는지.
 *
 * 나비가 대부분 걷고 있어야 배경이 살아 있다.
 * 공부·청소는 **가끔 보여서** 반가운 것이지, 늘 하고 있으면 그냥 정지 화면이다.
 */
const RARE = 0.03;
const RARE_MODES: [NabiMode, number][] = [
  ['sit', 0.4],
  ['groom', 0.24],
  ['study', 0.18],
  ['clean', 0.18],
];

/**
 * 개발 확인용 — 책 읽기만 무한 반복.
 * 그만하라고 하면 false로 되돌린다.
 */
const DEV_FORCE_STUDY = false;

function rareMode(): NabiMode {
  let r = Math.random();
  for (const [m, w] of RARE_MODES) {
    if (r < w) return m;
    r -= w;
  }
  return 'sit';
}

const SIDEBAR = 192;
const SIZE = 40;

interface Point {
  x: number;
  y: number;
}

/** 점프 한 번의 길이(틱), 최고 높이, 가로로 건너뛰는 거리 */
const JUMP_TICKS = 6;
const JUMP_ARC = 18;
const JUMP_DIST = 42;
/** 한 구간을 다 걸었을 때 점프로 다른 높이로 건너뛸 확률 */
const JUMP_CHANCE = 0.6;

function bounds() {
  const minX = SIDEBAR + 16;
  const maxX = Math.max(minX + 40, window.innerWidth - SIZE - 16);
  const minY = 72;
  const maxY = Math.max(minY + 40, window.innerHeight - SIZE - 24);
  return { minX, maxX, minY, maxY };
}

function randomX(): number {
  const { minX, maxX } = bounds();
  return Math.round(minX + Math.random() * (maxX - minX));
}

/**
 * 다음에 걸어갈 지점.
 *
 * 화면 폭 전체에서 아무 데나 고르면 한 번 걷기 시작할 때 40초씩 걸린다.
 * 점프는 **도착했을 때만** 하므로, 그러면 점프를 볼 일이 없다.
 * 그래서 지금 자리에서 멀지 않은 곳을 고른다.
 */
const LEG_MIN = 110;
const LEG_MAX = 320;

function nextTargetX(from: number): number {
  const { minX, maxX } = bounds();
  const dist = LEG_MIN + Math.random() * (LEG_MAX - LEG_MIN);
  const away = Math.random() < 0.5 ? -1 : 1;
  let to = from + dist * away;
  if (to > maxX || to < minX) to = from - dist * away;
  return Math.round(Math.min(Math.max(to, minX), maxX));
}

function randomY(): number {
  const { minY, maxY } = bounds();
  return Math.round(minY + Math.random() * (maxY - minY));
}

/**
 * 그림자·재 얼룩.
 *
 * docs/LORE.md "녹이란 무엇인가" / "재 — 무리해서 태운 불씨" — 둘 다
 * 나비가 다니는 이 배경에 스민다. 얼룩은 매 렌더마다 자리를 바꾸면
 * 안절부절못하는 것처럼 보이므로, **오늘 하루는 같은 자리**에 있도록
 * 날짜로 시드를 고정한다.
 */
interface Blotch {
  id: string;
  kind: 'shadow' | 'ash';
  x: number;
  y: number;
  size: number;
  /** ShadowBlotch의 SHAPES 인덱스. 실루엣을 섞어야 한 무더기가 비처럼 안 보인다 */
  shape: number;
}

const BLOTCH_OPACITY = [0, 0.22, 0.32, 0.42, 0.55];

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — 시드 하나로 재현 가능한 난수. 암호 용도가 아니라 자리 배치용 */
function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildBlotches(kind: Blotch['kind'], level: number, today: string): Blotch[] {
  if (level <= 0) return [];
  const rand = seededRandom(hashSeed(`${kind}:${today}:${level}`));
  const { minX, maxX, minY, maxY } = bounds();
  return Array.from({ length: level }, (_, i) => ({
    id: `${kind}-${i}`,
    kind,
    x: Math.round(minX + rand() * (maxX - minX)),
    y: Math.round(minY + rand() * (maxY - minY)),
    size: 18 + Math.round(rand() * 14),
    shape: Math.floor(rand() * 2),
  }));
}

/** 걷다가 아직 마주치지 않은 얼룩(그림자든 재든) 위를 밟았는지 */
const BLOTCH_REACT_RADIUS = 26;

function nearbyUnreactedBlotch(
  kind: Blotch['kind'],
  pos: Point,
  blotches: Blotch[],
  reacted: Set<string>,
): Blotch | null {
  for (const b of blotches) {
    if (b.kind !== kind || reacted.has(b.id)) continue;
    const dx = pos.x + SIZE / 2 - b.x;
    const dy = pos.y + SIZE / 2 - b.y;
    if (dx * dx + dy * dy <= BLOTCH_REACT_RADIUS ** 2) return b;
  }
  return null;
}

export function NabiCompanion({
  affection,
  petsToday,
  furId,
  accessoryId,
  onPet,
  shadowLevel = 0,
  ashLevel = 0,
}: {
  affection: number;
  petsToday: number;
  furId: string | null;
  accessoryId: string | null;
  onPet: () => boolean;
  /** docs/LORE.md "녹이란 무엇인가" — 방치된 만큼(0~4) */
  shadowLevel?: number;
  /** docs/LORE.md "재 — 무리해서 태운 불씨" — 무리한 만큼(0~4) */
  ashLevel?: number;
}) {
  const [pos, setPos] = useState<Point>({ x: SIDEBAR + 60, y: 300 });
  const [dir, setDir] = useState<1 | -1>(1);
  const [mode, setMode] = useState<NabiMode>(DEV_FORCE_STUDY ? 'study' : 'walk');
  const [step, setStep] = useState(0);
  const [airborne, setAirborne] = useState(false);
  /** 점프 진행도 0~1. 자세를 고르는 데 쓴다 */
  const [phase, setPhase] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);
  // 레벨이 바뀔 때만 다시 놓는다 — 매 렌더마다 흔들리면 안 된다. bounds()가
  // window를 읽으므로 서버 렌더와는 항상 다르지만, 장식이라 하이드레이션
  // 경고 대상이 아니다(그림자 자체가 "지금 이 화면"에서만 의미 있다)
  const blotches = useMemo(
    () => [
      ...buildBlotches('shadow', shadowLevel, todayKey()),
      ...buildBlotches('ash', ashLevel, todayKey()),
    ],
    [shadowLevel, ashLevel],
  );

  const idle = useRef(0);
  const modeRef = useRef<NabiMode>(DEV_FORCE_STUDY ? 'study' : 'walk');
  const dirRef = useRef<1 | -1>(1);
  const targetX = useRef<number | null>(null);
  /** 틱 루프는 마운트 시 한 번만 만들어지므로, 최신 위치·얼룩은 ref로 들여다본다 */
  const posRef = useRef<Point>(pos);
  const blotchesRef = useRef<Blotch[]>([]);
  /** 한 번 놀란 자리는 얼룩이 새로 생기기 전까지 다시 놀라지 않는다 */
  const reactedBlotches = useRef<Set<string>>(new Set());
  const jump = useRef<{
    fromX: number;
    toX: number;
    fromY: number;
    toY: number;
    t: number;
  } | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waking = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 틱 루프 안에서 최신 위치를 읽기 위한 거울. setPos는 함수형 업데이트라
  // 필요 없지만, 얼룩과의 거리를 재는 건 그 흐름 밖에서 해야 해서 따로 둔다
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  // 틱 루프(마운트 시 한 번만 생성됨)가 최신 얼룩을 보게 거울에 담고,
  // 얼룩이 새로 놓일 때마다 놀랄 기회도 새로 돌려준다
  useEffect(() => {
    blotchesRef.current = blotches;
    reactedBlotches.current = new Set();
  }, [blotches]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    // 첫 목적지만 정해두고, 이동은 틱에 맡긴다.
    // 여기서 바로 setState를 부르면 불필요한 연쇄 렌더가 난다
    targetX.current = randomX();

    const id = setInterval(() => {
      // 개발 확인: 책장만 계속 넘긴다
      if (DEV_FORCE_STUDY) {
        modeRef.current = 'study';
        setMode('study');
        const n = ANIMATED.study!.length;
        setStep((sp) => (sp + 1) % n);
        return;
      }

      const m = modeRef.current;
      let next: NabiMode = m;

      if (m === 'walk') {
        idle.current = 0;

        // 그림자·재 자리를 밟으면 딴짓 추첨보다 먼저 멈춰 선다 — 방치도 무리도
        // 못 본 척하지 않는 게 나비다(docs/LORE.md "그렇다면 왜 하필 용사인가").
        // 반응은 다르게 — 그림자는 놀라 멈칫하고, 재는 몸이 뻐근해 기지개를 켠다
        const shadowHit = nearbyUnreactedBlotch(
          'shadow',
          posRef.current,
          blotchesRef.current,
          reactedBlotches.current,
        );
        const ashHit =
          !shadowHit &&
          nearbyUnreactedBlotch(
            'ash',
            posRef.current,
            blotchesRef.current,
            reactedBlotches.current,
          );
        const hit = shadowHit || ashHit;

        if (hit) {
          reactedBlotches.current.add(hit.id);
          next = shadowHit ? 'sit' : 'stretch';
          setBubble(pickLine(shadowHit ? NABI_SHADOW_LINES : NABI_ASH_LINES));
          if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
          bubbleTimer.current = setTimeout(() => setBubble(null), 2400);
        } else {
          // 걷는 게 기본이다. 딴짓은 어쩌다 한 번만 — 100틱에 세 번쯤
          next = Math.random() < RARE ? rareMode() : 'walk';
        }
      } else if (m === 'stretch') {
        idle.current = 0;
        next = Math.random() < 0.5 ? 'walk' : 'stretch';
      } else {
        idle.current += 1;
        // 한 숨 자고 나면 기지개를 켜고 다시 걷는다
        if (m === 'sleep') next = idle.current > WAKE_AFTER ? 'stretch' : 'sleep';
        else if (m === 'doze')
          next = idle.current > SLEEP_AFTER ? 'sleep' : 'doze';
        else if (idle.current > DOZE_AFTER) next = 'doze';
        // 딴짓은 짧게 하고 곧 다시 걷는다. 눌러앉으면 배경이 정지 화면이 된다
        else if (m === 'study') next = Math.random() < 0.14 ? 'walk' : 'study';
        else if (m === 'clean') next = Math.random() < 0.14 ? 'walk' : 'clean';
        else if (m === 'groom') next = Math.random() < 0.22 ? 'walk' : 'groom';
        else next = Math.random() < 0.45 ? 'walk' : 'sit';
      }

      modeRef.current = next;
      setMode(next);

      // 책장·빗자루 프레임을 차례로 넘긴다
      if (next === 'study' || next === 'clean') {
        const n = ANIMATED[next]!.length;
        setStep((sp) => (sp + 1) % n);
        return;
      }
      if (next !== 'walk') return;

      setPos((prev) => {
        // 점프 중이면 포물선을 그리며 **가로로도** 건너뛴다
        const j = jump.current;
        if (j) {
          const p = Math.min(j.t / JUMP_TICKS, 1);
          setPhase(p);
          // 포물선. sin은 오르내림이 대칭이라 뛰는 맛이 덜하다 —
          // 실제로는 빨리 솟았다가 천천히 정점에 머문다
          const arc = Math.round(Math.sin(Math.PI * p) ** 0.8 * JUMP_ARC);
          const x = Math.round(j.fromX + (j.toX - j.fromX) * p);
          const y = Math.round(j.fromY + (j.toY - j.fromY) * p) - arc;
          j.t += 1;
          if (j.t > JUMP_TICKS) {
            jump.current = null;
            setAirborne(false);
            setPhase(0);
            // 착지한 높이에서 다시 수평으로 걷는다
            targetX.current = nextTargetX(x);
          }
          return { x, y };
        }

        if (targetX.current == null) targetX.current = nextTargetX(prev.x);
        const dx = targetX.current - prev.x;

        if (Math.abs(dx) <= STEP) {
          // 가끔 다른 높이로 건너뛴다. 대각선으로 흐르지 않고 점프로만
          if (Math.random() < JUMP_CHANCE) {
            const { minX, maxX } = bounds();
            // 가려던 방향으로 뛰되, 벽에 막히면 반대로 뛴다
            let toX = prev.x + JUMP_DIST * dirRef.current;
            if (toX > maxX || toX < minX) toX = prev.x - JUMP_DIST * dirRef.current;
            toX = Math.min(Math.max(toX, minX), maxX);

            dirRef.current = toX >= prev.x ? 1 : -1;
            setDir(dirRef.current);

            jump.current = {
              fromX: prev.x,
              toX,
              fromY: prev.y,
              toY: randomY(),
              t: 0,
            };
            setAirborne(true);
            setPhase(0);
            return prev;
          }
          targetX.current = nextTargetX(prev.x);
          return prev;
        }

        // 수평으로만, 정수 픽셀로만 옮긴다
        const mx = Math.sign(dx) * STEP;
        dirRef.current = mx > 0 ? 1 : -1;
        setDir(dirRef.current);
        return { x: prev.x + mx, y: prev.y };
      });

      setStep((sp) => (sp === 0 ? 1 : 0));
    }, TICK);

    return () => clearInterval(id);
  }, []);

  useEffect(
    () => () => {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      if (waking.current) clearTimeout(waking.current);
    },
    [],
  );

  const frames = ANIMATED[mode];
  /**
   * 점프 자세.
   *
   * 한 장으로 6틱을 버티면 뻣뻣하게 미끄러지는 것으로만 보인다.
   * 뜨기 직전과 닿기 직전에는 **웅크리고**, 오를 땐 다리를 접고,
   * 내릴 땐 뻗는다. 사람 눈은 이 네 장이면 점프로 읽는다.
   */
  const grid = airborne
    ? phase < 0.18 || phase > 0.82
      ? NABI_CROUCH
      : phase < 0.5
        ? NABI_JUMP_UP
        : NABI_JUMP_DOWN
    : frames
      ? frames[step % frames.length]
      : STILL[mode as keyof typeof STILL];
  const nabi = buildNabi(grid, furId, accessoryId);
  const left = PET_LIMIT - petsToday;
  const asleep = mode === 'doze' || mode === 'sleep';
  /** 걸을 때 착지(뚱) → 솟기(땅). 정수 픽셀로만 위아래 */
  const walkBob = mode === 'walk' && !airborne ? (step === 0 ? 2 : -2) : 0;
  /** 말풍선은 사이드바(z-30) 위에 따로 띄운다 */
  const bubbleX = Math.max(pos.x + SIZE / 2, SIDEBAR + 24);
  const bubbleY = pos.y + walkBob - 36;

  function pet() {
    const ok = onPet();
    // 방금 한 말을 또 하지 않게 직전 대사를 넘긴다
    const line = ok
      ? pickLine(NABI_LINES[mode], bubble)
      : pickLine(NABI_LIMIT_LINES, bubble);

    // 자다 들키면 화들짝 기지개부터 켠다
    if (asleep) {
      modeRef.current = 'stretch';
      setMode('stretch');
      if (waking.current) clearTimeout(waking.current);
      waking.current = setTimeout(() => {
        modeRef.current = 'sit';
        setMode('sit');
      }, 1200);
    } else {
      modeRef.current = 'sit';
      setMode('sit');
    }
    idle.current = 0;

    setBubble(line);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 2200);
  }

  return (
    /* z-20. 내용 패널이 z-30이라 그 뒤로 지나가고, 가려진 동안엔 눌리지도 않는다 */
    <div
      className="pointer-events-none fixed inset-0 z-20 hidden sm:block"
      aria-hidden={false}
    >
      {blotches.map((b) => (
        <ShadowBlotch
          key={b.id}
          kind={b.kind}
          shape={b.shape}
          size={b.size}
          opacity={BLOTCH_OPACITY[b.kind === 'shadow' ? shadowLevel : ashLevel]}
          style={{ left: b.x, top: b.y }}
        />
      ))}

      <div
        className="pointer-events-auto absolute"
        style={{ transform: `translate(${pos.x}px, ${pos.y + walkBob}px)` }}
      >
        {asleep && !bubble && (
          <span className="animate-blink absolute -top-4 left-full font-display text-[10px] text-ink-disabled">
            {mode === 'sleep' ? 'zZZ' : 'zZ'}
          </span>
        )}

        <button
          type="button"
          onClick={pet}
          title={
            left > 0
              ? `나비를 쓰다듬기 (오늘 ${left}번 남음) · ${affectionName(affection)}`
              : `오늘은 이만 하시지요 · ${affectionName(affection)}`
          }
          aria-label={`나비를 쓰다듬기. 호감도 ${affection}, ${affectionName(affection)}`}
          /* press 그림자는 scaleX 반전 때 좌하단에 검은 선으로 보인다 */
          className="block cursor-pointer focus-visible:outline-none"
          /* 기본 그림이 **왼쪽**을 보고 있다.
             오른쪽으로 갈 때(dir=1) 뒤집어야 진행 방향을 본다 */
          style={{ transform: `scaleX(${dir === 1 ? -1 : 1})` }}
        >
          <PixelSprite layers={nabi.layers} palette={nabi.palette} size={SIZE} />
        </button>
      </div>

      {/* 말풍선만 z-40. 나비(z-20)는 사이드바 뒤로 가도 대사는 가리지 않는다 */}
      {bubble &&
        createPortal(
          <span
            className="pointer-events-none fixed z-40 hidden border-2 border-ink bg-surface px-2 py-1 font-display text-[10px] whitespace-nowrap text-ink sm:block"
            style={{
              left: bubbleX,
              top: bubbleY,
              transform: 'translateX(-50%)',
            }}
          >
            {bubble}
          </span>,
          document.body,
        )}
    </div>
  );
}
