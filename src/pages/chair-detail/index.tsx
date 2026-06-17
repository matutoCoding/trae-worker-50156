import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { getChairById } from '@/data/mockChairs';
import { getDoctorByChairId } from '@/data/mockDoctors';
import { generateChairTimeSlots } from '@/utils/scheduler';
import { getLoadLevel } from '@/utils/loadBalancer';
import { getStatusText } from '@/utils/format';
import type { Chair } from '@/types/chair';
import type { TimeSlot } from '@/types/chair';

const ChairDetailPage: React.FC = () => {
  const router = useRouter();
  const [chair, setChair] = useState<Chair | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    const id = router.params.id;
    if (id) {
      const chairData = getChairById(id);
      if (chairData) {
        setChair(chairData);
        setTimeSlots(generateChairTimeSlots(id, new Date().toISOString().split('T')[0]));
      }
    }
  }, [router.params.id]);

  const doctor = useMemo(() => {
    if (!chair) return null;
    return getDoctorByChairId(chair.id);
  }, [chair]);

  const upcomingSlots = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return timeSlots.filter(slot => {
      const [hours, minutes] = slot.startTime.split(':').map(Number);
      return hours * 60 + minutes >= currentMinutes;
    }).slice(0, 6);
  }, [timeSlots]);

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

      {chair.waitCount > 0 && (
        <View className={styles.queueSection}>
          <Text className={styles.sectionTitle}>排队列表</Text>
          <View className={styles.queueList}>
            {Array.from({ length: Math.min(chair.waitCount, 3) }, (_, i) => (
              <View key={i} className={styles.queueItem}>
                <View className={styles.queueNumber}>
                  <Text className={styles.queueNumberText}>
                    {String(1000 + i + 1)}
                  </Text>
                </View>
                <View className={styles.queueInfo}>
                  <Text className={styles.queueName}>患者 {i + 1}</Text>
                  <Text className={styles.queueTime}>取号时间 09:{(i * 10 + 30).toString().padStart(2, '0')}</Text>
                </View>
                <Text className={styles.queuePosition}>第{i + 1}位</Text>
              </View>
            ))}
          </View>
        </View>
      )}

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
