import type { Chair, TimeSlot } from '@/types/chair';
import type { Appointment, ScheduleTimeSlot } from '@/types/appointment';
import { hasAvailableDoctorForChair } from '@/utils/doctorRoster';

export interface AllocationResult {
  chairId: string;
  chairName: string;
  startTime: string;
  endTime: string;
  score: number;
  reason: string;
}

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const findBestSlot = (
  chairs: Chair[],
  dayAppointments: Appointment[],
  date: string,
  startTimeStr: string,
  duration: number = 30
): AllocationResult | null => {
  console.log('[Scheduler] 查找最优牙椅:', { date, startTime: startTimeStr, chairCount: chairs.length });

  const startMinutes = timeToMinutes(startTimeStr);
  const endMinutes = startMinutes + duration;

  const validChairs = chairs.filter(chair => {
    if (chair.status === 'offline' || chair.status === 'maintenance') {
      console.log(`[Scheduler] 排除 ${chair.name}: 状态=${chair.status}`);
      return false;
    }
    return true;
  });

  if (validChairs.length === 0) {
    console.log('[Scheduler] 无可用牙椅：全部离线或维护');
    return null;
  }

  const doctorChairs = validChairs.filter(chair => {
    if (!hasAvailableDoctorForChair(chair.id, startTimeStr)) {
      console.log(`[Scheduler] 排除 ${chair.name}: 该时段无在岗医生`);
      return false;
    }
    return true;
  });

  if (doctorChairs.length === 0) {
    console.log('[Scheduler] 无可用牙椅：该时段所有牙椅无在岗医生');
    return null;
  }

  const candidates: {
    chair: Chair;
    score: number;
    fragmentationScore: number;
    loadScore: number;
    adjacencyScore: number;
  }[] = [];

  for (const chair of doctorChairs) {
    const chairAppointments = dayAppointments.filter(
      a => a.chairId === chair.id && a.status !== 'cancelled'
    );

    const isBusy = chairAppointments.some(a => {
      const aStart = timeToMinutes(a.startTime);
      const aEnd = timeToMinutes(a.endTime);
      return !(aEnd <= startMinutes || aStart >= endMinutes);
    });

    if (isBusy) {
      console.log(`[Scheduler] 排除 ${chair.name}: 时段已被预约`);
      continue;
    }

    const result = calculateComprehensiveScore(
      chair,
      chairAppointments,
      startMinutes,
      duration
    );

    candidates.push({
      chair,
      ...result
    });

    console.log(`[Scheduler] ${chair.name} 评分:`, {
      total: result.score,
      fragmentation: result.fragmentationScore,
      load: result.loadScore,
      adjacency: result.adjacencyScore,
      waitCount: chair.waitCount,
      loadRate: chair.loadRate
    });
  }

  if (candidates.length === 0) {
    console.log('[Scheduler] 无候选牙椅：所有牙椅时段已占用');
    return null;
  }

  candidates.sort((a, b) => b.score - a.score);

  const best = candidates[0];
  console.log('[Scheduler] 最优分配:', {
    chair: best.chair.name,
    score: best.score,
    reason: buildAllocationReason(best)
  });

  return {
    chairId: best.chair.id,
    chairName: best.chair.name,
    startTime: startTimeStr,
    endTime: minutesToTime(endMinutes),
    score: best.score,
    reason: buildAllocationReason(best)
  };
};

const calculateComprehensiveScore = (
  chair: Chair,
  chairAppointments: Appointment[],
  targetStart: number,
  duration: number
) => {
  const targetEnd = targetStart + duration;

  let adjacencyScore = 0;
  let fragmentationScore = 0;

  const sortedAppts = [...chairAppointments]
    .filter(a => a.status !== 'cancelled')
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  let prevEnd = 8 * 60;
  let targetIndex = -1;
  let gapBefore = 0;
  let gapAfter = 0;

  for (let i = 0; i <= sortedAppts.length; i++) {
    const gapStart = i === 0 ? 8 * 60 : timeToMinutes(sortedAppts[i - 1].endTime);
    const gapEnd = i === sortedAppts.length ? 18 * 60 : timeToMinutes(sortedAppts[i].startTime);

    if (targetStart >= gapStart && targetEnd <= gapEnd) {
      targetIndex = i;
      gapBefore = targetStart - gapStart;
      gapAfter = gapEnd - targetEnd;
      break;
    }
  }

  adjacencyScore = 0;
  if (targetIndex > 0) {
    if (gapBefore <= 30) {
      adjacencyScore += 35 - Math.floor(gapBefore / 10) * 5;
    }
  } else {
    adjacencyScore += 15;
  }

  if (targetIndex < sortedAppts.length && targetIndex >= 0) {
    if (gapAfter <= 30) {
      adjacencyScore += 35 - Math.floor(gapAfter / 10) * 5;
    }
  } else {
    adjacencyScore += 15;
  }

  const totalFreeTime = gapBefore + gapAfter;
  const createdFragmentBefore = gapBefore > 0 && gapBefore < 60 ? 1 : 0;
  const createdFragmentAfter = gapAfter > 0 && gapAfter < 60 ? 1 : 0;

  fragmentationScore = 50;
  fragmentationScore -= createdFragmentBefore * 20;
  fragmentationScore -= createdFragmentAfter * 20;

  if (totalFreeTime > 0 && totalFreeTime < 60) {
    fragmentationScore += 10;
  }
  if (totalFreeTime >= 180) {
    fragmentationScore -= 5;
  }

  let loadScore = 0;
  loadScore += (1 - chair.loadRate / 100) * 35;
  loadScore += (1 - Math.min(chair.waitCount / 8, 1)) * 25;
  loadScore += (1 - Math.min(chair.todayTotal / 15, 1)) * 20;

  if (chair.status === 'idle') {
    loadScore += 20;
  }

  const score = Math.round(
    adjacencyScore * 0.35 +
    fragmentationScore * 0.35 +
    loadScore * 0.30
  );

  return {
    score,
    adjacencyScore: Math.round(adjacencyScore),
    fragmentationScore: Math.round(fragmentationScore),
    loadScore: Math.round(loadScore)
  };
};

const buildAllocationReason = (data: {
  chair: Chair;
  adjacencyScore: number;
  fragmentationScore: number;
  loadScore: number;
}): string => {
  const reasons: string[] = [];

  if (data.adjacencyScore >= 50) {
    reasons.push('紧邻已有排期');
  }

  if (data.fragmentationScore >= 40) {
    reasons.push('减少碎片空档');
  }

  if (data.loadScore >= 60) {
    reasons.push('负载均衡分配');
  } else if (data.loadScore >= 40) {
    reasons.push('工作量适中');
  }

  if (data.chair.status === 'idle') {
    reasons.push('牙椅空闲');
  }

  if (reasons.length === 0) {
    return '基础可用牙椅分配';
  }

  return reasons.join(' + ');
};

export const findBestTimeSlot = (
  slots: ScheduleTimeSlot[],
  preferredTime?: string
): ScheduleTimeSlot | null => {
  const availableSlots = slots.filter(slot => slot.isAvailable && slot.availableCount > 0);
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
    return b.availableCount - a.availableCount;
  });

  return sortedByAvailability[0];
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
      const seed = (chairId.charCodeAt(3) || 0) + hour + min;
      const isAvailable = (seed % 5) < 4;

      slots.push({
        id: `${chairId}-${date}-${hour}-${min}`,
        startTime,
        endTime,
        available: isAvailable,
        chairId
      });
    }
  }

  return slots;
};

export interface MergedTimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  count: number;
  slots: TimeSlot[];
  patientName?: string;
  patientNumber?: number;
  appointment?: any;
  label?: string;
  subLabel?: string;
}

export const mergeAdjacentSlots = (slots: TimeSlot[]): MergedTimeBlock[] => {
  if (slots.length === 0) return [];

  const blocks: MergedTimeBlock[] = [];
  let current: MergedTimeBlock | null = null;

  const sameGroup = (a: TimeSlot, b: TimeSlot): boolean => {
    const aStatus = a.status || (a.available ? 'available' : 'occupied');
    const bStatus = b.status || (b.available ? 'available' : 'occupied');
    if (aStatus !== bStatus) return false;
    if (aStatus === 'occupied') {
      const aId = a.appointment?.id;
      const bId = b.appointment?.id;
      if (aId || bId) return aId === bId;
    }
    if (aStatus === 'visiting' || aStatus === 'queued') {
      const aNum = a.patientNumber;
      const bNum = b.patientNumber;
      if (aNum || bNum) return aNum === bNum;
    }
    return true;
  };

  for (const slot of slots) {
    const slotStatus = slot.status || (slot.available ? 'available' : 'occupied');
    if (!current) {
      current = {
        id: `block-${slot.startTime}`,
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime),
        status: slotStatus,
        count: 1,
        slots: [slot],
        patientName: slot.patientName,
        patientNumber: slot.patientNumber,
        appointment: slot.appointment,
        label: (slot as any).label,
        subLabel: (slot as any).subLabel
      };
      continue;
    }

    if (sameGroup(current.slots[current.slots.length - 1], slot)) {
      current.endTime = slot.endTime;
      current.durationMinutes = timeToMinutes(current.endTime) - timeToMinutes(current.startTime);
      current.count += 1;
      current.slots.push(slot);
    } else {
      blocks.push(current);
      current = {
        id: `block-${slot.startTime}`,
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime),
        status: slotStatus,
        count: 1,
        slots: [slot],
        patientName: slot.patientName,
        patientNumber: slot.patientNumber,
        appointment: slot.appointment,
        label: (slot as any).label,
        subLabel: (slot as any).subLabel
      };
    }
  }

  if (current) blocks.push(current);
  return blocks;
};

export const splitBlocksByPeriod = (
  blocks: MergedTimeBlock[]
): {
  morning: MergedTimeBlock[];
  afternoon: MergedTimeBlock[];
} => {
  const morning: MergedTimeBlock[] = [];
  const afternoon: MergedTimeBlock[] = [];
  const noon = 12 * 60;
  const afternoonStart = 13 * 60 + 30;

  blocks.forEach(block => {
    const start = timeToMinutes(block.startTime);
    if (start < noon) morning.push(block);
    else if (start >= afternoonStart) afternoon.push(block);
  });

  return { morning, afternoon };
};
