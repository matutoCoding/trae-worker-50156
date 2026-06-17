import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import ScheduleTimeline from '@/components/ScheduleTimeline';
import { mockScheduleDays } from '@/data/mockAppointments';
import { useChairStore } from '@/store/useChairStore';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { generateChairTimeSlots } from '@/utils/scheduler';
import type { ScheduleTimeSlot } from '@/types/appointment';
import type { TimeSlot } from '@/types/chair';
import dayjs from 'dayjs';

const SchedulePage: React.FC = () => {
  const { chairs } = useChairStore();
  const {
    scheduleDays,
    fetchAppointments,
    getSlotsForDate,
    findBestAllocation,
    createAppointment,
    appointments
  } = useAppointmentStore();

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleTimeSlot | null>(null);

  const displayDays = useMemo(() => {
    if (scheduleDays && scheduleDays.length > 0) {
      return scheduleDays;
    }
    return mockScheduleDays;
  }, [scheduleDays]);

  const currentDate = displayDays[selectedDateIndex];
  const dateKey = currentDate.date;

  const actualSlots = useMemo(() => {
    return getSlotsForDate(dateKey);
  }, [dateKey, getSlotsForDate, appointments, chairs]);

  const chairTimeSlots = useMemo(() => {
    return chairs.map(chair => ({
      chairId: chair.id,
      slots: generateChairTimeSlots(chair.id, dateKey)
    }));
  }, [chairs, dateKey]);

  const allocatedResult = useMemo(() => {
    if (!selectedSlot) return null;
    return findBestAllocation(dateKey, selectedSlot);
  }, [dateKey, selectedSlot, findBestAllocation, appointments, chairs]);

  const allocatedChair = useMemo(() => {
    if (!allocatedResult) return null;
    const chair = chairs.find(c => c.id === allocatedResult.chairId);
    return {
      chair,
      score: allocatedResult.score,
      reason: allocatedResult.reason
    };
  }, [allocatedResult, chairs]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleDateSelect = (index: number) => {
    setSelectedDateIndex(index);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: ScheduleTimeSlot) => {
    const isSlotAvailable =
      slot.available === true ||
      slot.isAvailable === true ||
      slot.availableChairs > 0 ||
      (slot.availableCount ?? 0) > 0;

    if (!isSlotAvailable) {
      Taro.showToast({ title: '该时段已约满', icon: 'none' });
      return;
    }
    setSelectedSlot(slot);
  };

  const handleConfirm = () => {
    if (!selectedSlot) {
      Taro.showToast({ title: '请先选择时段', icon: 'none' });
      return;
    }
    if (!allocatedResult) {
      Taro.showToast({ title: '当前无可用牙椅', icon: 'none' });
      return;
    }

    const chairName = allocatedChair?.chair?.name || allocatedResult.chairName;

    Taro.showModal({
      title: '确认预约',
      content: `确认预约${currentDate.weekday} ${dateKey} ${selectedSlot.time} ${chairName}？`,
      success: (res) => {
        if (res.confirm) {
          const result = createAppointment({
            date: dateKey,
            slot: selectedSlot,
            patientName: '张小明',
            patientPhone: '138****0000',
            department: '口腔综合'
          });

          if (result) {
            console.log('[Schedule] 预约创建成功:', result);
            Taro.showToast({ title: '预约成功', icon: 'success' });

            setTimeout(() => {
              Taro.redirectTo({
                url: `/pages/appointment-detail/index?id=${result.appointment.id}&new=1`
              });
            }, 1200);
          } else {
            Taro.showToast({
              title: '预约失败，请稍后重试',
              icon: 'none'
            });
          }
        }
      }
    });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.dateSelector}>
        <ScrollView scrollX className={styles.dateScroll}>
          {displayDays.map((day, index) => (
            <View
              key={day.date}
              className={classnames(styles.dateItem, {
                [styles.active]: index === selectedDateIndex
              })}
              onClick={() => handleDateSelect(index)}
            >
              <Text className={styles.weekday}>{day.weekday}</Text>
              <Text className={styles.dateDay}>
                {day.date.split('-')[2].replace(/^0/, '')}
              </Text>
              <Text className={styles.dateNum}>
                {day.date.split('-')[1]}月
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.legend}>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.available}`} />
          <Text className={styles.legendText}>空闲</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.busy}`} />
          <Text className={styles.legendText}>使用中</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.maintenance}`} />
          <Text className={styles.legendText}>维护</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.offline}`} />
          <Text className={styles.legendText}>离线</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>选择时段</Text>
        <TimeSlotPicker
          slots={actualSlots}
          selectedSlotId={selectedSlot?.id}
          onSelect={handleSlotSelect}
          columns={4}
        />
        <Text className={styles.tipText}>
          选择时段后系统将自动为您分配最优牙椅
        </Text>
      </View>

      {allocatedChair && selectedSlot && allocatedChair.chair && (
        <View className={styles.allocationCard}>
          <View className={styles.allocationHeader}>
            <Text className={styles.allocationTitle}>智能分配结果</Text>
            <View className={styles.allocationBadge}>
              <Text className={styles.allocationBadgeText}>已匹配最优牙椅</Text>
            </View>
          </View>

          <View className={styles.allocationInfo}>
            <View className={styles.allocationChair}>
              <Text className={styles.chairName}>{allocatedChair.chair.name}</Text>
              <Text className={styles.chairTime}>
                {dateKey} {selectedSlot.time} · 约30分钟
              </Text>
            </View>
            <View className={styles.allocationScore}>
              <Text className={styles.scoreValue}>{allocatedChair.score}分</Text>
              <Text className={styles.scoreLabel}>匹配度</Text>
            </View>
          </View>

          <Text className={styles.allocationReason}>
            {allocatedChair.reason}
          </Text>
        </View>
      )}

      <View className={styles.timelineSection}>
        <Text className={styles.sectionTitle}>牙椅排期时间轴</Text>
        <ScheduleTimeline
          chairs={chairs}
          timeSlots={chairTimeSlots as { chairId: string; slots: TimeSlot[] }[]}
        />
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.summary}>
          <Text className={styles.summaryLabel}>已选：</Text>
          <Text className={styles.summaryValue}>
            {selectedSlot
              ? `${currentDate.weekday} ${selectedSlot.time} ${allocatedChair?.chair?.name || '系统分配'}`
              : '请选择预约时段'}
          </Text>
        </View>
        <View
          className={classnames(styles.confirmBtn, {
            [styles.disabled]: !selectedSlot
          })}
          onClick={handleConfirm}
        >
          <Text className={styles.confirmBtnText}>确认预约</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default SchedulePage;
