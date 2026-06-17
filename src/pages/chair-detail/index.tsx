import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useChairStore } from '@/store/useChairStore';
import { useQueueStore } from '@/store/useQueueStore';
import { getDoctorByChairId } from '@/data/mockDoctors';
import { generateChairTimeSlots } from '@/utils/scheduler';
import { getLoadLevel } from '@/utils/loadBalancer';
import { getStatusText } from '@/utils/format';
import type { Chair } from '@/types/chair';
import type { TimeSlot } from '@/types/chair';

const ChairDetailPage: React.FC = () => {
  const router = useRouter();
  const { getChairById, chairs, clearCurrentPatient } = useChairStore();
  const { getWaitingByChair, callNextByChair, completeVisit } = useQueueStore();

  const [chair, setChair] = useState<Chair | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isCalling, setIsCalling] = useState(false);

  const chairId = router.params.id;

  useEffect(() => {
    if (chairId) {
      const chairData = getChairById(chairId);
      if (chairData) {
        setChair(chairData);
        setTimeSlots(generateChairTimeSlots(chairId, new Date().toISOString().split('T')[0]));
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
  }, [chairId, getWaitingByChair, chairs]);

  const upcomingSlots = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return timeSlots.filter(slot => {
      const [hours, minutes] = slot.startTime.split(':').map(Number);
      return hours * 60 + minutes >= currentMinutes;
    }).slice(0, 6);
  }, [timeSlots]);

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
    if (!chair.currentPatient) {
      Taro.showToast({ title: '暂无就诊中患者', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '完成就诊',
      content: `确认 ${chair.currentNumber}号 ${chair.currentPatient} 就诊完成？`,
      success: (res) => {
        if (res.confirm) {
          const waiting = getWaitingByChair(chairId);
          const currentPatient = waiting[0] || { id: `temp-${chairId}` };
          completeVisit(currentPatient.id);
          clearCurrentPatient(chairId);

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
          <Text className={styles.statValue}>{chair.department}</Text>
          <Text className={styles.statLabel}>所属科室</Text>
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
        <Text className={styles.sectionTitle}>今日排期</Text>
        <View className={styles.scheduleTimeline}>
          {upcomingSlots.map(slot => {
            let status: 'available' | 'occupied' | 'maintenance' = 'available';
            if (chair.status === 'maintenance') status = 'maintenance';
            else if (!slot.available) status = 'occupied';

            return (
              <View key={slot.id} className={classnames(styles.timelineItem, styles[status])}>
                <Text className={styles.timelineTime}>{slot.startTime}</Text>
                <View className={classnames(styles.timelineDot, styles[status])} />
                <Text className={styles.timelineContent}>
                  {status === 'available' ? '可预约' : status === 'occupied' ? '已预约' : '维护中'}
                </Text>
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
