import type { Patient, QueueInfo } from '@/types/patient';

export const mockQueue: Patient[] = [
  {
    id: 'patient-001',
    name: '张小明',
    phone: '138****5678',
    number: 1024,
    status: 'visiting',
    chairId: 'chair-001',
    department: '口腔科',
    doctorId: 'doctor-001',
    takeTime: '09:30',
    callTime: '09:45'
  },
  {
    id: 'patient-002',
    name: '李华',
    phone: '139****1234',
    number: 1018,
    status: 'visiting',
    chairId: 'chair-002',
    department: '口腔科',
    doctorId: 'doctor-002',
    takeTime: '09:20',
    callTime: '09:40'
  },
  {
    id: 'patient-003',
    name: '王芳',
    phone: '137****8888',
    number: 1031,
    status: 'visiting',
    chairId: 'chair-004',
    department: '口腔科',
    doctorId: 'doctor-004',
    takeTime: '09:50',
    callTime: '10:05'
  },
  {
    id: 'patient-004',
    name: '刘强',
    phone: '136****6666',
    number: 1035,
    status: 'waiting',
    department: '口腔科',
    estimatedTime: '10:30',
    takeTime: '10:00'
  },
  {
    id: 'patient-005',
    name: '陈静',
    phone: '135****5555',
    number: 1036,
    status: 'waiting',
    department: '口腔科',
    estimatedTime: '10:45',
    takeTime: '10:05'
  },
  {
    id: 'patient-006',
    name: '赵磊',
    phone: '134****4444',
    number: 1037,
    status: 'waiting',
    department: '口腔科',
    estimatedTime: '11:00',
    takeTime: '10:10'
  },
  {
    id: 'patient-007',
    name: '孙婷',
    phone: '133****3333',
    number: 1038,
    status: 'waiting',
    department: '口腔科',
    estimatedTime: '11:15',
    takeTime: '10:15'
  },
  {
    id: 'patient-008',
    name: '周杰',
    phone: '132****2222',
    number: 1039,
    status: 'waiting',
    department: '口腔科',
    estimatedTime: '11:30',
    takeTime: '10:20'
  },
  {
    id: 'patient-009',
    name: '吴敏',
    phone: '131****1111',
    number: 1040,
    status: 'waiting',
    department: '口腔科',
    estimatedTime: '11:45',
    takeTime: '10:25'
  }
];

export const mockQueueInfo: QueueInfo = {
  department: '口腔科',
  totalWaiting: 6,
  avgWaitTime: 25,
  chairs: [
    { chairId: 'chair-001', chairName: '1号牙椅', currentNumber: 1024, waitCount: 3 },
    { chairId: 'chair-002', chairName: '2号牙椅', currentNumber: 1018, waitCount: 1 },
    { chairId: 'chair-003', chairName: '3号牙椅', currentNumber: 0, waitCount: 0 },
    { chairId: 'chair-004', chairName: '4号牙椅', currentNumber: 1031, waitCount: 2 },
    { chairId: 'chair-005', chairName: '5号牙椅', currentNumber: 0, waitCount: 0 },
    { chairId: 'chair-006', chairName: '6号牙椅', currentNumber: 0, waitCount: 0 }
  ]
};

export const getWaitingPatients = (): Patient[] => {
  return mockQueue.filter(p => p.status === 'waiting');
};

export const getCurrentNumber = (): number => {
  const visiting = mockQueue.filter(p => p.status === 'visiting' || p.status === 'calling');
  if (visiting.length === 0) return 0;
  return Math.max(...visiting.map(p => p.number));
};

export const getMyNumber = (): Patient | undefined => {
  return mockQueue.find(p => p.status === 'waiting');
};
