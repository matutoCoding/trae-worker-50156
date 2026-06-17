import dayjs from 'dayjs';

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatTime = (time: string, format: string = 'HH:mm'): string => {
  return dayjs(`2024-01-01 ${time}`).format(format);
};

export const formatDateTime = (datetime: string, format: string = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(datetime).format(format);
};

export const getWeekday = (date: string | Date): string => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[dayjs(date).day()];
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    idle: '空闲',
    busy: '使用中',
    maintenance: '维护中',
    offline: '离线',
    waiting: '等待中',
    calling: '叫号中',
    visiting: '就诊中',
    completed: '已完成',
    cancelled: '已取消',
    pending: '待确认',
    confirmed: '已确认',
    onDuty: '在岗',
    offDuty: '离岗',
    leave: '休假'
  };
  return statusMap[status] || status;
};

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
