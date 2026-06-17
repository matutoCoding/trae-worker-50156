import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useChairStore } from '@/store/useChairStore';
import { useQueueStore } from '@/store/useQueueStore';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { getDoctorByChairId } from '@/data/mockDoctors';
import { timeToMinutes, minutesToTime } from '@/utils/scheduler';
import { getLoadLevel } from '@/utils/loadBalancer';
import { getStatusText } from '@/utils/format';
import type { Chair } from '@/types/chair';
import type { TimeSlot } from '@/types/chair';
import dayjs from 'dayjs';

const ChairDetailPage: React.FC = () => {
  const router = useRouter();
  const { getChairById, chairs, getTodayAppointmentsCount, getTodayOccupiedMinutes } = useChairStore();
  const {
    getWaitingByChair,
    callNextByChair,
    completeVisit,
    getCurrentVisitingPatient,
    patients
  } = useQueueStore();
  const { getChairDaySchedule, appointments } = useAppointmentStore();

  const [chair, setChair] = useState<Chair | null>(null);
  const [isCalling, setIsCalling] = useState(false);

  const chairId = router.params.id;
  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    if (chairId) {
      const chairData = getChairById(chairId);
      if (chairData) {
        setChair(chairData);
      }
    }
  }, [chairId, getChairById]);

  useEffect(() => {
    if (!chairId) return;
    const updatedChair = getChairById(chairId);
    if (updatedChair) {
      setChair(updatedChair);
    }
  }, [chairs, chairId, getChairById]);

  const doctor = useMemo(() => {
    if (!chair) return null;
    return getDoctorByChairId(chair.id);
  }, [chair]);

  const waitingPatients = useMemo(() => {
    if (!chairId) return [];
    return getWaitingByChair(chairId);
  }, [chairId, getWaitingByChair, chairs, patients]);

  const visitingPatient = useMemo(() => {
    if (!chairId) return null;
    return getCurrentVisitingPatient(chairId);
  }, [chairId, getCurrentVisitingPatient, patients]);

  const appointmentStats = useMemo(() => {
    if (!chairId) return { count: 0, timeStr: '0m' };
    const count = getTodayAppointmentsCount(chairId);
    const minutes = getTodayOccupiedMinutes(chairId);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeStr = hours > 0
      ? `${hours}小时${mins > 0 ? `${mins}分` : ''}`
      : `${mins}分钟`;
    return { count, timeStr, minutes };
  }, [chairId, getTodayAppointmentsCount, getTodayOccupiedMinutes, appointments]);

  const dayViewSlots = useMemo<(TimeSlot & { label?: string; subLabel?: string })[]>(() => {
    if (!chairId) return [];
    const baseSlots = getChairDaySchedule(chairId, today);
    if (!visitingPatient && waitingPatients.length === 0) {
      return baseSlots;
    }

    const nowMin = timeToMinutes(dayjs().format('HH:mm'));
    const result = [...baseSlots];

    if (visitingPatient) {
      const visitEnd = Math.min(Math.max(nowMin + 20, nowMin), 18 * 60);
      for (let i = 0; i < result.length; i++) {
        const sStart = timeToMinutes(result[i].startTime);
        const sEnd = sStart + 30;
        if (!(visitEnd <= sStart || nowMin >= sEnd)) {
          result[i] = {
            ...result[i],
            status: 'visiting',
            available: false,
            patientName: visitingPatient.name,
            patientNumber: visitingPatient.number,
            label: '正在就诊',
            subLabel: `${visitingPatient.number}号 ${visitingPatient.name}`
          };
        }
      }
    }

    if (waitingPatients.length > 0) {
      let queueStart = visitingPatient
        ? Math.ceil((nowMin + 30) / 30) * 30
        : Math.ceil(nowMin / 30) * 30;

      waitingPatients.forEach((patient, idx) => {
        const pStart = queueStart + idx * 30;
        const pEnd = pStart + 30;
        if (pStart >= 18 * 60) return;

        for (let i = 0; i < result.length; i++) {
          const sStart = timeToMinutes(result[i].startTime);
          const sEnd = sStart + 30;
          if (!(pEnd <= sStart || pStart >= sEnd)) {
            if (result[i].status === 'available') {
              result[i] = {
                ...result[i],
                status: 'queued',
                available: false,
                patientName: patient.name,
                patientNumber: patient.number,
                label: idx === 0 ? '下一位' : `排队第${idx + 1}位`,
                subLabel: `${patient.number}号 ${patient.name}`
              };
            }
          }
        }
      });
    }

    return result;
  }, [chairId, today, getChairDaySchedule, visitingPatient, waitingPatients, appointments]);

  const upcomingSlots = dayViewSlots;

  const handleCallNext = () => {
    if (!chairId || !chair) return;
    if (chair.status === 'offline' || chair.status === 'maintenance') return;

    setIsCalling(true);
    const result = callNextByChair(chairId);

    if (result) {
      Taro.showToast({
        title: `叫号: ${result.number}号 ${result.name}`,
        icon: 'none',
        duration: 2500
      });
    } else {
      Taro.showToast({
        title: '暂无等待患者',
        icon: 'none'
      });
    }

    setTimeout(() => setIsCalling(false), 800);
  };

  const handleCompleteVisit = () => {
    if (!chair) return;
    if (!visitingPatient && !chair.currentPatient) {
      Taro.showToast({ title: '暂无就诊中患者', icon: 'none' });
      return;
    }

    const patientId = visitingPatient?.id;
    if (!patientId) {
      Taro.showToast({ title: '未找到患者记录', icon: 'none' });
      return;
    }
    const patientName = visitingPatient?.name || chair.currentPatient;
    const patientNumber = visitingPatient?.number || chair.currentNumber;

    Taro.showModal({
      title: '完成就诊',
      content: `确认 ${patientNumber}号 ${patientName} 就诊完成？\n\n完成后当前牙椅变为空闲，等待列表保持不变，需手动「叫下一位」。`,
      success: (res) => {
        if (res.confirm) {
          completeVisit(patientId);
          Taro.showToast({
            title: '就诊完成',
            icon: 'success'
          });
        }
      }
    });
  };

  const handleBook = () => {
    if (!chair) return;
    if (chair.status === 'offline' || chair.status === 'maintenance') {
      Taro.showToast({ title: '该牙椅暂不可预约', icon: 'none' });
      return;
    }
    Taro.switchTab({
      url: '/pages/schedule/index'
    });
  };

  if (!chair) {
    return (
      <View className={styles.page}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const loadLevel = getLoadLevel(chair.loadRate);

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.chairHeader}>
        <Text className={styles.chairName}>{chair.name}</Text>
        <Text className={styles.chairStatus}>
          {getStatusText(chair.status)}
        </Text>
      </View>

      {chair.currentPatient && (
        <View className={styles.currentPatientCard}>
          <View className={styles.currentPatientIcon}>
            <Text>👤</Text>
          </View>
          <View className={styles.currentPatientInfo}>
            <Text className={styles.currentPatientLabel}>当前就诊</Text>
            <Text className={styles.currentPatientDetail}>
              {chair.currentNumber}号 · {chair.currentPatient}
            </Text>
          </View>
          <View
            className={styles.completeBtn}
            onClick={handleCompleteVisit}
          >
            <Text className={styles.completeBtnText}>完成</Text>
          </View>
        </View>
      )}

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{chair.waitCount}</Text>
          <Text className={styles.statLabel}>等待人数</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{chair.todayTotal}</Text>
          <Text className={styles.statLabel}>今日接诊</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{appointmentStats.count}</Text>
          <Text className={styles.statLabel}>今日预约</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValueSmall}>{appointmentStats.timeStr}</Text>
          <Text className={styles.statLabel}>预约占用</Text>
        </View>
      </View>

      <View className={styles.loadSection}>
        <Text className={styles.sectionTitle}>负载情况</Text>
        <View className={styles.loadBar}>
          <View
            className={classnames(styles.loadFill, styles[loadLevel])}
            style={{ width: `${chair.loadRate}%` }}
          />
        </View>
        <View className={styles.loadInfo}>
          <Text className={styles.loadLabel}>当前负载率</Text>
          <Text className={classnames(styles.loadPercent, styles[loadLevel])}>
            {chair.loadRate}%
          </Text>
        </View>
      </View>

      <View className={styles.actionRow}>
        <View
          className={classnames(styles.callBtn, {
            [styles.callBtnDisabled]: chair.status === 'offline' || chair.status === 'maintenance',
            [styles.callBtnActive]: isCalling
          })}
          onClick={handleCallNext}
        >
          <Text className={styles.callBtnIcon}>📢</Text>
          <Text className={styles.callBtnText}>
            {chair.status === 'offline' || chair.status === 'maintenance'
              ? '设备停用'
              : waitingPatients.length > 0
                ? `叫下一位 (${waitingPatients.length}人等待)`
                : '暂无等待'}
          </Text>
        </View>
      </View>

      {doctor && (
        <View className={styles.doctorSection}>
          <Text className={styles.sectionTitle}>坐诊医生</Text>
          <View className={styles.doctorCard}>
            <Image
              className={styles.doctorAvatar}
              src={doctor.avatar}
              mode="aspectFill"
            />
            <View className={styles.doctorInfo}>
              <Text className={styles.doctorName}>{doctor.name}</Text>
              <Text className={styles.doctorTitle}>{doctor.title}</Text>
              <Text className={styles.doctorSpecialty}>擅长：{doctor.specialty}</Text>
            </View>
            <Text className={styles.doctorStatus}>
              {doctor.status === 'onDuty' ? '在岗' : '离岗'}
            </Text>
          </View>
        </View>
      )}

      {waitingPatients.length > 0 && (
        <View className={styles.queueSection}>
          <View className={styles.queueHeader}>
            <Text className={styles.sectionTitle}>排队列表</Text>
            <Text className={styles.queueCount}>共 {waitingPatients.length} 人</Text>
          </View>
          <View className={styles.queueList}>
            {waitingPatients.slice(0, 5).map((patient, index) => (
              <View key={patient.id} className={styles.queueItem}>
                <View className={classnames(styles.queueNumber, index === 0 ? styles.queueNumberNext : '')}>
                  <Text className={styles.queueNumberText}>
                    {String(patient.number)}
                  </Text>
                </View>
                <View className={styles.queueInfo}>
                  <Text className={styles.queueName}>{patient.name}</Text>
                  <Text className={styles.queueTime}>
                    取号 {patient.takeTime} · 预计 {patient.estimatedTime || '--:--'}
                  </Text>
                </View>
                <View className={styles.queuePositionWrap}>
                  <Text className={classnames(
                    styles.queuePosition,
                    index === 0 ? styles.queuePositionFirst : ''
                  )}>
                    {index === 0 ? '下一位' : `第${index + 1}位`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          {waitingPatients.length > 5 && (
            <View className={styles.queueMore}>
              <Text className={styles.queueMoreText}>
                还有 {waitingPatients.length - 5} 人等待...
              </Text>
            </View>
          )}
        </View>
      )}

      <View className={styles.scheduleSection}>
        <View className={styles.scheduleHeader}>
          <Text className={styles.sectionTitle}>今日安排 · 日视图</Text>
          <View className={styles.scheduleLegend}>
            <View className={styles.legendItem}>
              <View className={`${styles.legendDot} ${styles.legendVisiting}`} />
              <Text className={styles.legendText}>就诊</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={`${styles.legendDot} ${styles.legendQueued}`} />
              <Text className={styles.legendText}>排队</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={`${styles.legendDot} ${styles.legendOccupied}`} />
              <Text className={styles.legendText}>预约</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={`${styles.legendDot} ${styles.legendAvailable}`} />
              <Text className={styles.legendText}>空闲</Text>
            </View>
          </View>
        </View>
        <View className={styles.dayView}>
          {dayViewSlots.map(slot => {
            const statusClass = slot.status || (slot.available ? 'available' : 'occupied');
            const labelMap: Record<string, string> = {
              visiting: '正在就诊',
              queued: slot.label || '排队中',
              occupied: '已预约',
              maintenance: '维护中',
              offline: '离线',
              available: '空闲可约'
            };
            const subLabel = slot.subLabel
              || (slot.appointment ? `${slot.appointment.patientName}` : '');

            return (
              <View
                key={slot.id}
                className={classnames(styles.dayViewItem, styles[statusClass])}
              >
                <View className={styles.dayViewTime}>
                  <Text className={styles.dayViewTimeText}>{slot.startTime}</Text>
                </View>
                <View className={styles.dayViewDotWrap}>
                  <View className={classnames(styles.dayViewDot, styles[`dot${statusClass.charAt(0).toUpperCase()}${statusClass.slice(1)}`])} />
                  <View className={styles.dayViewLine} />
                </View>
                <View className={styles.dayViewContent}>
                  <Text className={styles.dayViewLabel}>
                    {slot.label || labelMap[statusClass] || '未知'}
                  </Text>
                  {subLabel && (
                    <Text className={styles.dayViewSubLabel}>{subLabel}</Text>
                  )}
                  {statusClass === 'occupied' && slot.appointment && (
                    <Text className={styles.dayViewMeta}>
                      {slot.appointment.type || slot.appointment.department} · {slot.appointment.startTime}-{slot.appointment.endTime}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View
        className={classnames(styles.actionBtn, {
          [styles.disabled]: chair.status === 'offline' || chair.status === 'maintenance'
        })}
        onClick={handleBook}
      >
        <Text className={styles.actionBtnText}>
          {chair.status === 'idle' ? '立即预约' : '预约此牙椅'}
        </Text>
      </View>
    </ScrollView>
  );
};

export default ChairDetailPage;
