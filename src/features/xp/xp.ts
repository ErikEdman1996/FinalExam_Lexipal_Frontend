export const XP_PER_LEVEL = 100;

export interface XpProgressMeta {
  totalXp: number;
  level: number;
  levelStartXp: number;
  levelEndXp: number;
  xpIntoLevel: number;
  progressPercent: number;
}

export const getXpProgressMeta = (totalXp: number): XpProgressMeta => {
  const safeTotalXp = Math.max(0, Math.floor(totalXp));
  const level = Math.floor(safeTotalXp / XP_PER_LEVEL) + 1;
  const levelStartXp = (level - 1) * XP_PER_LEVEL;
  const levelEndXp = levelStartXp + XP_PER_LEVEL;
  const xpIntoLevel = safeTotalXp - levelStartXp;
  const progressPercent = (xpIntoLevel / XP_PER_LEVEL) * 100;

  return {
    totalXp: safeTotalXp,
    level,
    levelStartXp,
    levelEndXp,
    xpIntoLevel,
    progressPercent,
  };
};

export const getXpProgressMetaWithStep = (totalXp: number, xpPerLevel: number): XpProgressMeta => {
  const safeStep = Math.max(1, Math.floor(xpPerLevel));
  const safeTotalXp = Math.max(0, Math.floor(totalXp));
  const level = Math.floor(safeTotalXp / safeStep) + 1;
  const levelStartXp = (level - 1) * safeStep;
  const levelEndXp = levelStartXp + safeStep;
  const xpIntoLevel = safeTotalXp - levelStartXp;
  const progressPercent = (xpIntoLevel / safeStep) * 100;

  return {
    totalXp: safeTotalXp,
    level,
    levelStartXp,
    levelEndXp,
    xpIntoLevel,
    progressPercent,
  };
};
