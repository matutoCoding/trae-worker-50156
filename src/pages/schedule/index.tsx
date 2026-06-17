import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import ScheduleTimeline from '@/components/ScheduleTimeline';
import { mockScheduleDays, mockAppointments } from '@/data/mockAppointments';
import { mockChairs } from '@/data/mockChairs';
import { generateChairTimeSlots } from '@/utils/scheduler';
import type { ScheduleTimeSlot } from '@/types/appointment';
import type { TimeSlot } from '@/types/chair';

const SchedulePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleTimeSlot | null>(null);

  const currentDate = mockScheduleDays[selectedDate];

  const chairTimeSlots = useMemo(() => {
    return mockChairs.map(chair => ({
      chairId: chair.id,
      slots: generateChairTimeSlots(chair.id, currentDate.date)
    }));
  }, [currentDate.date]);

  const allocatedChair = useMemo(() => {
    if (!selectedSlot) return null;

    const availableChairs = mockChairs.filter(
      chair => chair.status !== 'offline' && chair.status !== 'maintenance'
    );

    if (availableChairs.length === 0) return null;

    const sortedChairs = [...availableChairs].sort((a, b) => {
      const aLoad = a.loadRate + a.todayTotal * 2;
      const bLoad = b.loadRate + b.todayTotal * 2;
      return aLoad - bLoad;
    });

    const bestChair = sortedChairs[0];
    const score = Math.round(100 - bestChair.loadRate * 0.5 - bestChair.todayTotal * 2);

    return {
      chair: bestChair,
      score,
      reason: '系统智能分配：负载均衡 + 低工作量 + 连续空闲时段'
    };
  }, [selectedSlot]);

  const handleDateSelect = (index: number) => {
    setSelectedDate(index);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: ScheduleTimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleConfirm = () => {
    if (!selectedSlot || !allocatedChair) {
      Taro.showToast({ title: '请先选择时段', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '确认预约',
      content: `预约${currentDate.date} ${selectedSlot.time} ${allocatedChair.chair.name}？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '预约成功', icon: 'success' });
          setTimeout(() => {
            Taro.navigateTo({
              url: `/pages/appointment-detail/index?id=${Date.now()}`
            });
          }, 1500);
        }
      }
    });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.dateSelector}>
        <ScrollView scrollX className={styles.dateScroll}>
          {mockScheduleDays.map((day, index) => (
            <View
              key={day.date}
              className={classnames(styles.dateItem, {
                [styles.active]: index === selectedDate
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
          slots={currentDate.timeSlots}
          selectedSlotId={selectedSlot?.id}
          onSelect={handleSlotSelect}
          columns={4}
        />
        <Text className={styles.tipText}>
          选择时段后系统将自动为您分配最优牙椅
        </Text>
      </View>

      {allocatedChair && selectedSlot && (
        <View className={styles.allocationCard}>
          <View className={styles.allocationHeader}>
            <Text className={styles.allocationTitle}>智能分配结果</Text>
            <View className={styles.allocationBadge}>
              <Text className={styles.allocationBadgeText}>已为您匹配最优牙椅</Text>
            </View>
          </View>

          <View className={styles.allocationInfo}>
            <View className={styles.allocationChair}>
              <Text className={styles.chairName}>{allocatedChair.chair.name}</Text>
              <Text className={styles.chairTime}>
                {currentDate.date} {selectedSlot.time} · 约30分钟
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
          chairs={mockChairs}
          timeSlots={chairTimeSlots as { chairId: string; slots: TimeSlot[] }[]}
        />
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.summary}>
          <Text className={styles.summaryLabel}>已选：</Text>
          <Text className={styles.summaryValue}>
            {selectedSlot
              ? `${currentDate.weekday} ${selectedSlot.time} ${allocatedChair?.chair.name || ''}`
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
