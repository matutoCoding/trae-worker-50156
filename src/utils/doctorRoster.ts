import type { Doctor, DoctorShift } from '@/types/doctor';
import { mockDoctors } from '@/data/mockDoctors';
import { timeToMinutes } from '@/utils/scheduler';

export const isDoctorOnDuty = (doctorId: string, atTime?: string): boolean => {
  const doctor = mockDoctors.find(d => d.id === doctorId);
  if (!doctor) return false;
  if (doctor.status !== 'onDuty') return false;
  if (!atTime) return true;

  const shiftMap: Record<string, [number, number]> = {
    morning: [8 * 60, 12 * 60],
    afternoon: [13 * 60 + 30, 18 * 60],
    fullDay: [8 * 60, 18 * 60]
  };

  if (doctor.chairId) {
    const [startMin, endMin] = shiftMap['fullDay'];
    const atMin = timeToMinutes(atTime);
    if (atMin < startMin || atMin >= endMin) {
      if (atMin < 12 * 60) {
        const [amS, amE] = shiftMap['morning'];
        return atMin >= amS && atMin < amE;
      } else {
        const [pmS, pmE] = shiftMap['afternoon'];
        return atMin >= pmS && atMin < pmE;
      }
    }
  }
  return true;
};

export const getOnDutyDoctorsByDepartment = (department: string): Doctor[] => {
  return mockDoctors.filter(
    d => d.department === department && d.status === 'onDuty'
  );
};

export const getDoctorByChair = (chairId: string): Doctor | undefined => {
  return mockDoctors.find(d => d.chairId === chairId);
};

export const hasAvailableDoctorForChair = (chairId: string, atTime?: string): boolean => {
  const doctor = getDoctorByChair(chairId);
  if (!doctor) return false;
  return isDoctorOnDuty(doctor.id, atTime);
};
