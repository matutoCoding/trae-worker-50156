import type { Chair } from '@/types/chair';

export const mockChairs: Chair[] = [
  {
    id: 'chair-001',
    name: '1号牙椅',
    number: 1,
    status: 'busy',
    currentPatient: '张小明',
    currentNumber: 1024,
    currentDoctorId: 'doctor-001',
    currentDoctorName: '张明远',
    currentDoctorTitle: '主任医师',
    waitCount: 3,
    loadRate: 75,
    todayTotal: 12,
    department: '口腔科'
  },
  {
    id: 'chair-002',
    name: '2号牙椅',
    number: 2,
    status: 'busy',
    currentPatient: '李华',
    currentNumber: 1018,
    currentDoctorId: 'doctor-002',
    currentDoctorName: '李晓婷',
    currentDoctorTitle: '副主任医师',
    waitCount: 1,
    loadRate: 45,
    todayTotal: 8,
    department: '口腔科'
  },
  {
    id: 'chair-003',
    name: '3号牙椅',
    number: 3,
    status: 'busy',
    currentPatient: '郑伟',
    currentNumber: 1029,
    currentDoctorId: 'doctor-003',
    currentDoctorName: '王建国',
    currentDoctorTitle: '主治医师',
    waitCount: 1,
    loadRate: 25,
    todayTotal: 6,
    department: '口腔科'
  },
  {
    id: 'chair-004',
    name: '4号牙椅',
    number: 4,
    status: 'busy',
    currentPatient: '王芳',
    currentNumber: 1031,
    currentDoctorId: 'doctor-004',
    currentDoctorName: '陈美玲',
    currentDoctorTitle: '副主任医师',
    waitCount: 1,
    loadRate: 10,
    todayTotal: 10,
    department: '口腔科'
  },
  {
    id: 'chair-005',
    name: '5号牙椅',
    number: 5,
    status: 'maintenance',
    currentDoctorId: 'doctor-005',
    currentDoctorName: '刘伟',
    currentDoctorTitle: '主治医师',
    waitCount: 0,
    loadRate: 0,
    todayTotal: 5,
    department: '口腔科'
  },
  {
    id: 'chair-006',
    name: '6号牙椅',
    number: 6,
    status: 'idle',
    currentDoctorId: 'doctor-006',
    currentDoctorName: '赵丽萍',
    currentDoctorTitle: '主任医师',
    waitCount: 0,
    loadRate: 0,
    todayTotal: 4,
    department: '口腔科'
  }
];

export const getChairById = (id: string): Chair | undefined => {
  return mockChairs.find(chair => chair.id === id);
};

export const getChairsByStatus = (status: Chair['status']): Chair[] => {
  return mockChairs.filter(chair => chair.status === status);
};

export const getAvailableChairs = (): Chair[] => {
  return mockChairs.filter(chair => chair.status === 'idle');
};
