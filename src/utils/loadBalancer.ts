import type { Chair } from '@/types/chair';
import type { Patient } from '@/types/patient';

export interface LoadBalanceResult {
  chairId: string;
  chairName: string;
  estimatedWaitTime: number;
  reason: string;
}

export const getIdleChairs = (chairs: Chair[]): Chair[] => {
  return chairs.filter(chair => chair.status === 'idle');
};

export const getActiveChairs = (chairs: Chair[]): Chair[] => {
  return chairs.filter(chair => chair.status === 'idle' || chair.status === 'busy');
};

export const findBestChair = (chairs: Chair[]): LoadBalanceResult | null => {
  const activeChairs = getActiveChairs(chairs);
  if (activeChairs.length === 0) return null;

  const idleChairs = getIdleChairs(activeChairs);
  if (idleChairs.length > 0) {
    const bestChair = idleChairs.reduce((best, chair) => {
      return chair.todayTotal < best.todayTotal ? chair : best;
    });

    return {
      chairId: bestChair.id,
      chairName: bestChair.name,
      estimatedWaitTime: 0,
      reason: '空闲牙椅直接分配'
    };
  }

  const sortedByLoad = [...activeChairs].sort((a, b) => a.loadRate - b.loadRate);
  const bestChair = sortedByLoad[0];
  const estimatedWaitTime = Math.ceil(bestChair.waitCount * 20);

  return {
    chairId: bestChair.id,
    chairName: bestChair.name,
    estimatedWaitTime,
    reason: '负载均衡分配至最空闲队列'
  };
};

export const calculateLoadRate = (waitCount: number, maxWait: number = 10): number => {
  return Math.min(Math.round((waitCount / maxWait) * 100), 100);
};

export const getLoadLevel = (loadRate: number): 'low' | 'medium' | 'high' => {
  if (loadRate < 40) return 'low';
  if (loadRate < 70) return 'medium';
  return 'high';
};

export const balanceQueue = (
  chairs: Chair[],
  threshold: number = 3
): { from: string; to: string; count: number }[] => {
  const adjustments: { from: string; to: string; count: number }[] = [];
  const activeChairs = getActiveChairs(chairs);

  if (activeChairs.length < 2) return adjustments;

  const avgWait = activeChairs.reduce((sum, c) => sum + c.waitCount, 0) / activeChairs.length;

  const overloaded = activeChairs.filter(c => c.waitCount - avgWait >= threshold);
  const underloaded = activeChairs.filter(c => avgWait - c.waitCount >= threshold);

  if (overloaded.length > 0 && underloaded.length > 0) {
    overloaded.forEach(overChair => {
      underloaded.forEach(underChair => {
        const transferCount = Math.min(
          Math.floor((overChair.waitCount - avgWait) / 2),
          Math.floor((avgWait - underChair.waitCount) / 2)
        );
        if (transferCount > 0) {
          adjustments.push({
            from: overChair.id,
            to: underChair.id,
            count: transferCount
          });
        }
      });
    });
  }

  return adjustments;
};

export const getAverageWaitTime = (chairs: Chair[]): number => {
  const activeChairs = getActiveChairs(chairs);
  if (activeChairs.length === 0) return 0;

  const totalWait = activeChairs.reduce((sum, chair) => sum + chair.waitCount * 20, 0);
  return Math.round(totalWait / activeChairs.length);
};
