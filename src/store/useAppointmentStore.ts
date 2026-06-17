import { create } from 'zustand';
import type { Appointment, ScheduleDay, ScheduleTimeSlot } from '@/types/appointment';
import type { Chair } from '@/types/chair';
import type { TimeSlot } from '@/types/chair';
import { mockAppointments, mockScheduleDays, generateTimeSlots } from '@/data/mockAppointments';
import { useChairStore } from '@/store/useChairStore';
import { findBestSlot, timeToMinutes, minutesToTime } from '@/utils/scheduler';
import dayjs from 'dayjs';

interface AppointmentState {
  appointments: Appointment[];
  scheduleDays: ScheduleDay[];
  selectedDate: string | null;
  selectedSlot: ScheduleTimeSlot | null;
  newAppointmentIds: string[];

  fetchAppointments: () => void;
  fetchScheduleDays: () => void;
  selectDate: (date: string) => void;
  selectSlot: (slot: ScheduleTimeSlot | null) => void;
  getSlotsForDate: (date: string) => ScheduleTimeSlot[];
  getChairDaySchedule: (chairId: string, date: string) => TimeSlot[];
  getDayAppointmentsByChair: (chairId: string, date: string) => Appointment[];
  getAppointmentById: (id: string) => Appointment | undefined;
  getMyAppointments: () => Appointment[];
  findBestAllocation: (
    date: string,
    slot: ScheduleTimeSlot
  ) => ReturnType<typeof findBestSlot>;
  createAppointment: (info: {
    date: string;
    slot: ScheduleTimeSlot;
    patientName: string;
    patientPhone: string;
    department: string;
  }) => {
    appointment: Appointment;
    allocation: { chairId: string; chairName: string; score: number; reason: string } | null;
  } | null;
  cancelAppointment: (id: string) => void;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [...mockAppointments],
  scheduleDays: mockScheduleDays,
  selectedDate: null,
  selectedSlot: null,
  newAppointmentIds: [],

  fetchAppointments: () => {
    console.log('[AppointmentStore] 获取预约列表（不重置，保持现有状态）');
  },

  fetchScheduleDays: () => {
    console.log('[AppointmentStore] 获取排期日期');
  },

  selectDate: (date: string) => {
    set({ selectedDate: date, selectedSlot: null });
  },

  selectSlot: (slot: ScheduleTimeSlot | null) => {
    set({ selectedSlot: slot });
  },

  getSlotsForDate: (date: string) => {
    const chairState = useChairStore.getState();
    const chairs = chairState.chairs;
    const dayAppointments = get().appointments.filter(
      a => a.date === date && a.status !== 'cancelled'
    );

    const availableChairIds = chairs
      .filter(c => c.status !== 'offline' && c.status !== 'maintenance')
      .map(c => c.id);
    const totalCapacity = availableChairIds.length;

    const baseSlots = generateTimeSlots();
    return baseSlots.map(slot => {
      const slotStart = timeToMinutes(slot.time);
      const slotEnd = slotStart + 30;
      const bookedChairIds: string[] = [];

      dayAppointments.forEach(a => {
        const aStart = timeToMinutes(a.startTime);
        const aEnd = timeToMinutes(a.endTime);
        if (!(aEnd <= slotStart || aStart >= slotEnd)) {
          if (!bookedChairIds.includes(a.chairId)) {
            bookedChairIds.push(a.chairId);
          }
        }
      });

      const booked = bookedChairIds.length;
      const remaining = Math.max(0, totalCapacity - booked);

      return {
        ...slot,
        available: remaining > 0,
        availableChairs: remaining,
        totalChairs: totalCapacity,
        isAvailable: remaining > 0,
        availableCount: remaining,
        totalCount: totalCapacity
      } as ScheduleTimeSlot;
    });
  },

  getDayAppointmentsByChair: (chairId: string, date: string) => {
    return get()
      .appointments
      .filter(a => a.chairId === chairId && a.date === date && a.status !== 'cancelled')
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  },

  getChairDaySchedule: (chairId: string, date: string) => {
    const chairState = useChairStore.getState();
    const chair = chairState.getChairById(chairId);
    const dayAppts = get().getDayAppointmentsByChair(chairId, date);
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 18;
    const interval = 30;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += interval) {
        if (hour === 12 && min < 30) continue;
        const startTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const endTime = minutesToTime(hour * 60 + min + interval);
        const slotStart = hour * 60 + min;
        const slotEnd = slotStart + interval;

        const occupied = dayAppts.find(a => {
          const aStart = timeToMinutes(a.startTime);
          const aEnd = timeToMinutes(a.endTime);
          return !(aEnd <= slotStart || aStart >= slotEnd);
        });

        let available = true;
        let status: 'available' | 'occupied' | 'maintenance' | 'offline' = 'available';
        let appointmentInfo: any = null;

        if (chair?.status === 'maintenance') {
          status = 'maintenance';
          available = false;
        } else if (chair?.status === 'offline') {
          status = 'offline';
          available = false;
        } else if (occupied) {
          status = 'occupied';
          available = false;
          appointmentInfo = occupied;
        }

        slots.push({
          id: `${chairId}-${date}-${hour}-${min}`,
          startTime,
          endTime,
          available,
          chairId,
          status,
          appointment: appointmentInfo
        });
      }
    }

    return slots;
  },

  getAppointmentById: (id: string) => {
    return get().appointments.find(a => a.id === id);
  },

  getMyAppointments: () => {
    return get()
      .appointments
      .filter(a => a.status !== 'cancelled')
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });
  },

  findBestAllocation: (date: string, slot: ScheduleTimeSlot) => {
    const chairState = useChairStore.getState();
    const chairs = chairState.chairs;
    const dayAppointments = get().appointments.filter(
      a => a.date === date && a.status !== 'cancelled'
    );

    return findBestSlot(chairs, dayAppointments, date, slot.time);
  },

  createAppointment: (info) => {
    console.log('[AppointmentStore] 创建预约:', info);

    const allocation = get().findBestAllocation(info.date, info.slot);
    if (!allocation) {
      console.log('[AppointmentStore] 无可用牙椅 - 分配失败');
      return null;
    }

    const chairState = useChairStore.getState();
    const chair = chairState.getChairById(allocation.chairId);
    const startTime = dayjs(`${info.date} ${info.slot.time}`, 'YYYY-MM-DD HH:mm');
    const endTime = startTime.add(30, 'minute');

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      code: `APT${Date.now().toString().slice(-6)}`,
      patientName: info.patientName,
      patientPhone: info.patientPhone,
      department: info.department,
      date: info.date,
      startTime: info.slot.time,
      endTime: endTime.format('HH:mm'),
      duration: 30,
      status: 'pending',
      chairId: allocation.chairId,
      chairName: chair?.name,
      doctorId: chair?.currentDoctorId,
      doctorName: chair?.currentDoctorName,
      createdAt: new Date().toISOString()
    };

    set(state => ({
      appointments: [...state.appointments, newAppointment],
      newAppointmentIds: [...state.newAppointmentIds, newAppointment.id]
    }));

    console.log('[AppointmentStore] 预约创建成功:', {
      id: newAppointment.id,
      date: newAppointment.date,
      time: newAppointment.startTime,
      chair: newAppointment.chairName,
      allocation: allocation.reason
    });

    return {
      appointment: newAppointment,
      allocation: {
        chairId: allocation.chairId,
        chairName: chair?.name || allocation.chairName,
        score: allocation.score,
        reason: allocation.reason
      }
    };
  },

  cancelAppointment: (id: string) => {
    console.log(`[AppointmentStore] 取消预约: ${id}`);
    set(state => ({
      appointments: state.appointments.map(a =>
        a.id === id ? { ...a, status: 'cancelled' } : a
      )
    }));
  }
}));
