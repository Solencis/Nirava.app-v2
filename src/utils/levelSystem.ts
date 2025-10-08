export interface LevelInfo {
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  totalXpForLevel: number;
}

export const calculateLevel = (totalXP: number): LevelInfo => {
  let level = 1;
  let accumulatedXP = 0;
  let xpForNextLevel = 100;

  while (totalXP >= accumulatedXP + xpForNextLevel) {
    accumulatedXP += xpForNextLevel;
    level++;
    xpForNextLevel = calculateXPForLevel(level);
  }

  const xpForCurrentLevel = totalXP - accumulatedXP;

  return {
    level,
    xpForCurrentLevel,
    xpForNextLevel,
    totalXpForLevel: accumulatedXP
  };
};

export const calculateXPForLevel = (level: number): number => {
  const baseXP = 100;
  const exponent = 1.15;
  return Math.floor(baseXP * Math.pow(level, exponent));
};

export const getLevelThresholds = (maxLevel: number = 50): number[] => {
  const thresholds: number[] = [0];
  let accumulated = 0;

  for (let level = 1; level <= maxLevel; level++) {
    accumulated += calculateXPForLevel(level);
    thresholds.push(accumulated);
  }

  return thresholds;
};

export const getXPProgressPercentage = (totalXP: number): number => {
  const levelInfo = calculateLevel(totalXP);
  return (levelInfo.xpForCurrentLevel / levelInfo.xpForNextLevel) * 100;
};
