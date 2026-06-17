import type { Doctor } from '@/types/doctor';

export const mockDoctors: Doctor[] = [
  {
    id: 'doctor-001',
    name: '张明远',
    title: '主任医师',
    department: '口腔科',
    avatar: 'https://picsum.photos/id/64/200/200',
    status: 'onDuty',
    chairId: 'chair-001',
    specialty: '口腔种植、牙周病',
    todayPatients: 12
  },
  {
    id: 'doctor-002',
    name: '李晓婷',
    title: '副主任医师',
    department: '口腔科',
    avatar: 'https://picsum.photos/id/91/200/200',
    status: 'onDuty',
    chairId: 'chair-002',
    specialty: '正畸、牙齿美容',
    todayPatients: 8
  },
  {
    id: 'doctor-003',
    name: '王建国',
    title: '主治医师',
    department: '口腔科',
    avatar: 'https://picsum.photos/id/338/200/200',
    status: 'onDuty',
    chairId: 'chair-003',
    specialty: '牙体牙髓、补牙',
    todayPatients: 6
  },
  {
    id: 'doctor-004',
    name: '陈美玲',
    title: '副主任医师',
    department: '口腔科',
    avatar: 'https://picsum.photos/id/1027/200/200',
    status: 'onDuty',
    chairId: 'chair-004',
    specialty: '口腔修复、义齿',
    todayPatients: 10
  },
  {
    id: 'doctor-005',
    name: '刘伟',
    title: '主治医师',
    department: '口腔科',
    avatar: 'https://picsum.photos/id/177/200/200',
    status: 'offDuty',
    chairId: 'chair-005',
    specialty: '儿童口腔、预防保健',
    todayPatients: 5
  },
  {
    id: 'doctor-006',
    name: '赵丽萍',
    title: '主任医师',
    department: '口腔科',
    avatar: 'https://picsum.photos/id/106/200/200',
    status: 'onDuty',
    chairId: 'chair-006',
    specialty: '口腔颌面外科',
    todayPatients: 4
  }
];

export const getDoctorById = (id: string): Doctor | undefined => {
  return mockDoctors.find(doctor => doctor.id === id);
};

export const getDoctorsByStatus = (status: Doctor['status']): Doctor[] => {
  return mockDoctors.filter(doctor => doctor.status === status);
};

export const getDoctorByChairId = (chairId: string): Doctor | undefined => {
  return mockDoctors.find(doctor => doctor.chairId === chairId);
};
