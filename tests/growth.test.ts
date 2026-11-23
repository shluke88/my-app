import { describe, expect, it } from "vitest";
import { addXp, appearanceStage } from "@/lib/growth/level";
import { drawItem, drawRarity, seededRng } from "@/lib/growth/itemDraw";
import { ITEMS } from "@/lib/growth/items";
import { CueFilter } from "@/lib/exercise/cueFilter";
import { EXERCISE_RULES } from "@/lib/exercise/rules";
import { JumpingJackJudge, PlankJudge } from "@/lib/exercise/judges/others";

// DESIGN 8.2 계산 테스트 (경험치·레벨·아이템·안내·플랭크·점핑잭)
describe("경험치·레벨", () => {
  it("#8 스쿼트 좋음 12회 + 얕음 3회 = 하체 +63", () => {
    const r = EXERCISE_RULES.squat;
    expect(12 * r.xpPerUnit + 3 * r.xpShallow).toBe(63);
  });
  it("#10 1레벨에서 60 → 2레벨, 경험치 10", () => {
    expect(addXp({ level: 1, xp: 0 }, 60).next).toEqual({ level: 2, xp: 10 });
  });
  it("#11 20레벨에서는 얻은 경험치 0", () => {
    const r = addXp({ level: 20, xp: 0 }, 100);
    expect(r.gained).toBe(0);
    expect(r.next.level).toBe(20);
  });
  it("#11-1 외형 단계", () => {
    expect([1, 4, 5, 9, 10, 15, 20].map(appearanceStage)).toEqual([1, 1, 2, 2, 3, 4, 4]);
  });
  it("#12 3→4레벨이면 아이템 1개, #12-1 1레벨+500 → 5레벨·1개, #12-2 3→8레벨 2개", () => {
    expect(addXp({ level: 3, xp: 149 }, 1).unlocks).toBe(1);
    const r = addXp({ level: 1, xp: 0 }, 500);
    expect(r.next.level).toBe(5);
    expect(r.unlocks).toBe(1);
    // 3레벨에서 8레벨까지: 150+200+250+300+350 = 1250
    expect(addXp({ level: 3, xp: 0 }, 1250).unlocks).toBe(2);
  });
});

describe("아이템 뽑기", () => {
  it("#13 노말을 다 모았는데 노말이 뽑히면 레어에서", () => {
    const normals = ITEMS.filter((i) => i.rarity === "normal").map((i) => i.id);
    const item = drawItem(normals, () => 0.1); // 0.1×100 = 10 → 노말
    expect(item?.rarity).toBe("rare");
  });
  it("#13-1 레어가 뽑혔는데 레어·에픽·레전드를 다 모았으면 노말에서", () => {
    const high = ITEMS.filter((i) => i.rarity !== "normal").map((i) => i.id);
    expect(drawItem(high, () => 0.7)?.rarity).toBe("normal");
  });
  it("다 모으면 null", () => {
    expect(drawItem(ITEMS.map((i) => i.id))).toBeNull();
  });
  it("#14 등급 비율 60/28/10/2 (±1.5%p)", () => {
    const rng = seededRng(42);
    const n = 10000;
    const count = { normal: 0, rare: 0, epic: 0, legend: 0 };
    for (let i = 0; i < n; i++) count[drawRarity(rng)]++;
    expect(Math.abs((count.normal / n) * 100 - 60)).toBeLessThan(1.5);
    expect(Math.abs((count.rare / n) * 100 - 28)).toBeLessThan(1.5);
    expect(Math.abs((count.epic / n) * 100 - 10)).toBeLessThan(1.5);
    expect(Math.abs((count.legend / n) * 100 - 2)).toBeLessThan(1.5);
  });
});

describe("안내 필터", () => {
  const cues = EXERCISE_RULES.squat.cues;
  it("#6 자세형 0.3초는 안내 없음, 0.6초는 1번", () => {
    const f = new CueFilter(cues);
    expect(f.updatePosture(["squat-lean"], 0)).toBeNull();
    expect(f.updatePosture(["squat-lean"], 0.3)).toBeNull();
    expect(f.updatePosture([], 0.35)).toBeNull();
    f.updatePosture(["squat-lean"], 1);
    expect(f.updatePosture(["squat-lean"], 1.6)?.cue.id).toBe("squat-lean");
    expect(f.updatePosture(["squat-lean"], 2)).toBeNull(); // 같은 반복에 한 번만
  });
  it("#7 같은 안내가 2초 간격이면 두 번째는 화면만", () => {
    const f = new CueFilter(cues);
    expect(f.endRep(["squat-depth"], 10)?.speak).toBe(true);
    const second = f.endRep(["squat-depth"], 12);
    expect(second?.cue.id).toBe("squat-depth");
    expect(second?.speak).toBe(false);
    expect(f.endRep(["squat-depth"], 13.5)?.speak).toBe(true);
  });
  it("#17 범위형은 반복 끝에 우선순위대로 하나만", () => {
    const f = new CueFilter(EXERCISE_RULES.jumpingJack.cues);
    expect(f.endRep(["jj-legs", "jj-arms"], 0)?.cue.id).toBe("jj-arms");
  });
});

describe("플랭크·점핑잭", () => {
  it("#15 플랭크 4초 → 무너짐 → 3초 = 1단위", () => {
    const p = new PlankJudge();
    expect(p.addAligned(4)).toBe(0);
    expect(p.addAligned(3)).toBe(1);
  });
  it("점핑잭 모음 → 크게 벌림 → 모음은 좋음, 작게 벌리면 얕음", () => {
    const j = new JumpingJackJudge();
    j.updateMeasures(0.8, -1); // 모음
    j.updateMeasures(1.6, 0.3); // 벌림 (손목이 어깨 위)
    expect(j.updateMeasures(0.8, -1)?.grade).toBe("good");
    j.updateMeasures(1.3, -0.5); // 다리만 조금
    expect(j.updateMeasures(0.8, -1)?.grade).toBe("shallow");
  });
});
