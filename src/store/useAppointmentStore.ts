import { create } from 'zustand';
import type { Appointment, ScheduleDay, ScheduleTimeSlot } from '@/types/appointment';
import type { Chair } from '@/types/chair';
import { mockAppointments, mockScheduleDays, generateTimeSlots } from '@/data/mockAppointments';
import { useChairStore } from '@/store/useChairStore';
import { findBestSlot } from '@/utils/scheduler';
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
  appointments: mockAppointments,
  scheduleDays: mockScheduleDays,
  selectedDate: null,
  selectedSlot: null,
  newAppointmentIds: [],

  fetchAppointments: () => {
    console.log('[AppointmentStore] 获取预约列表');
    set({ loading: true });
    setTimeout(() => {
      set({ loading: false });
    }, 300);
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
    const dayAppointments = get().appointments.filter(a => a.date === date);

    const baseSlots = generateTimeSlots();
    return baseSlots.map(slot => {
      const slotAppointments = dayAppointments.filter(a => a.startTime === slot.time);
      const totalCapacity = chairs.filter(c => c.status !== 'offline' && c.status !== 'maintenance').length;
      const booked = slotAppointments.length;
      const available = Math.max(0, totalCapacity - booked);

      return {
        ...slot,
        availableCount: available,
        totalCount: totalCapacity,
        isAvailable: available > 0
      } as ScheduleTimeSlot;
    });
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
      console.log('[AppointmentStore] 无可用牙椅');
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

    console.log('[AppointmentStore] 预约创建成功:', newAppointment);

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
