import type { Chair, TimeSlot } from '@/types/chair';
import type { ScheduleTimeSlot } from '@/types/appointment';

export interface AllocationResult {
  chairId: string;
  chairName: string;
  startTime: string;
  endTime: string;
  score: number;
  reason: string;
}

export const findBestSlot = (
  timeSlots: ScheduleTimeSlot[],
  preferredTime?: string,
  duration: number = 30
): ScheduleTimeSlot | null => {
  const availableSlots = timeSlots.filter(slot => slot.available && slot.availableChairs > 0);
  if (availableSlots.length === 0) return null;

  if (preferredTime) {
    const exactSlot = availableSlots.find(slot => slot.time === preferredTime);
    if (exactSlot) return exactSlot;

    const sortedByProximity = [...availableSlots].sort((a, b) => {
      const aDiff = Math.abs(timeToMinutes(a.time) - timeToMinutes(preferredTime));
      const bDiff = Math.abs(timeToMinutes(b.time) - timeToMinutes(preferredTime));
      return aDiff - bDiff;
    });
    return sortedByProximity[0];
  }

  const sortedByAvailability = [...availableSlots].sort((a, b) => {
    return b.availableChairs - a.availableChairs;
  });

  return sortedByAvailability[0];
};

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const allocateChair = (
  chairs: Chair[],
  timeSlots: { chairId: string; slots: TimeSlot[] }[],
  startTime: string,
  duration: number = 30
): AllocationResult | null => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + duration;

  const candidates: AllocationResult[] = [];

  chairs.forEach(chair => {
    if (chair.status === 'offline' || chair.status === 'maintenance') return;

    const chairSlots = timeSlots.find(ts => ts.chairId === chair.id)?.slots || [];
    const isAvailable = checkAvailability(chairSlots, startMinutes, endMinutes);

    if (isAvailable) {
      const score = calculateAllocationScore(chair, chairSlots, startMinutes);
      candidates.push({
        chairId: chair.id,
        chairName: chair.name,
        startTime,
        endTime: minutesToTime(endMinutes),
        score,
        reason: getScoreReason(score)
      });
    }
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
};

const checkAvailability = (slots: TimeSlot[], start: number, end: number): boolean => {
  for (let i = start; i < end; i += 30) {
    const timeStr = minutesToTime(i);
    const slot = slots.find(s => s.startTime === timeStr);
    if (!slot || !slot.available) return false;
  }
  return true;
};

const calculateAllocationScore = (
  chair: Chair,
  slots: TimeSlot[],
  startTime: number
): number => {
  let score = 0;

  score += (1 - chair.loadRate / 100) * 40;

  const daySlots = slots.filter(s => timeToMinutes(s.startTime) >= startTime);
  const consecutiveFree = countConsecutiveFree(slots, startTime);
  score += Math.min(consecutiveFree / 4, 1) * 30;

  score += (1 - chair.todayTotal / 20) * 20;

  if (chair.status === 'idle') {
    score += 10;
  }

  return Math.round(score);
};

const countConsecutiveFree = (slots: TimeSlot[], startTime: number): number => {
  let count = 0;
  let currentTime = startTime;

  while (currentTime < 18 * 60) {
    const timeStr = minutesToTime(currentTime);
    const slot = slots.find(s => s.startTime === timeStr);
    if (slot && slot.available) {
      count++;
      currentTime += 30;
    } else {
      break;
    }
  }

  return count;
};

const getScoreReason = (score: number): string => {
  if (score >= 80) return '最优分配：负载均衡 + 连续时段 + 低工作量';
  if (score >= 60) return '良好分配：负载均衡 + 连续时段';
  if (score >= 40) return '一般分配：基本可用';
  return '备选分配';
};

export const avoidFragmentation = (
  chairs: Chair[],
  timeSlots: { chairId: string; slots: TimeSlot[] }[]
): void => {
  console.log('[Scheduler] 执行碎片时间优化');
};

export const generateChairTimeSlots = (chairId: string, date: string): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startHour = 8;
  const endHour = 18;
  const interval = 30;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += interval) {
      if (hour === 12 && min < 30) continue;

      const startTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const endTime = minutesToTime(hour * 60 + min + interval);
      const random = Math.random();

      slots.push({
        id: `${chairId}-${date}-${hour}-${min}`,
        startTime,
        endTime,
        available: random > 0.4,
        chairId
      });
    }
  }

  return slots;
};
