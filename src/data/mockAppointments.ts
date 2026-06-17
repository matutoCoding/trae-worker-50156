import type { Appointment, ScheduleDay, ScheduleTimeSlot } from '@/types/appointment';
import dayjs from 'dayjs';

const generateTimeSlots = (): ScheduleTimeSlot[] => {
  const slots: ScheduleTimeSlot[] = [];
  const startHour = 8;
  const endHour = 18;
  const interval = 30;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += interval) {
      if (hour === 12 && min < 30) continue;
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const random = Math.random();
      const available = random > 0.3;
      const availableChairs = available ? Math.floor(Math.random() * 4) + 2 : 0;

      slots.push({
        id: `slot-${hour}-${min}`,
        time,
        available,
        availableChairs,
        totalChairs: 6,
        isAvailable: available,
        availableCount: availableChairs,
        totalCount: 6
      });
    }
  }
  return slots;
};

export { generateTimeSlots };

export const mockScheduleDays: ScheduleDay[] = Array.from({ length: 7 }, (_, i) => {
  const date = dayjs().add(i, 'day');
  const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return {
    date: date.format('YYYY-MM-DD'),
    weekday: i === 0 ? '今天' : weekdayMap[date.day()],
    isToday: i === 0,
    timeSlots: generateTimeSlots()
  };
});

export const mockAppointments: Appointment[] = [
  {
    id: 'appt-001',
    patientName: '张小明',
    patientPhone: '138****5678',
    date: dayjs().format('YYYY-MM-DD'),
    startTime: '09:30',
    endTime: '10:00',
    chairId: 'chair-001',
    chairName: '1号牙椅',
    doctorId: 'doctor-001',
    doctorName: '张明远',
    department: '口腔科',
    status: 'confirmed',
    type: '常规检查',
    createTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'appt-002',
    patientName: '李华',
    patientPhone: '139****1234',
    date: dayjs().format('YYYY-MM-DD'),
    startTime: '14:00',
    endTime: '14:30',
    chairId: 'chair-002',
    chairName: '2号牙椅',
    doctorId: 'doctor-002',
    doctorName: '李晓婷',
    department: '口腔科',
    status: 'pending',
    type: '洗牙',
    createTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'appt-003',
    patientName: '王芳',
    patientPhone: '137****8888',
    date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    startTime: '10:00',
    endTime: '11:00',
    chairId: 'chair-004',
    chairName: '4号牙椅',
    doctorId: 'doctor-004',
    doctorName: '陈美玲',
    department: '口腔科',
    status: 'confirmed',
    type: '种植牙',
    createTime: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'appt-004',
    patientName: '刘强',
    patientPhone: '136****6666',
    date: dayjs().add(2, 'day').format('YYYY-MM-DD'),
    startTime: '15:30',
    endTime: '16:00',
    chairId: 'chair-003',
    chairName: '3号牙椅',
    doctorId: 'doctor-003',
    doctorName: '王建国',
    department: '口腔科',
    status: 'confirmed',
    type: '补牙',
    createTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm')
  }
];

export const getAppointmentsByDate = (date: string): Appointment[] => {
  return mockAppointments.filter(appt => appt.date === date);
};

export const getAppointmentById = (id: string): Appointment | undefined => {
  return mockAppointments.find(appt => appt.id === id);
};

export const getMyAppointments = (): Appointment[] => {
  return mockAppointments;
};
