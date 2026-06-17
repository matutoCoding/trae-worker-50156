import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Chair } from '@/types/chair';
import type { TimeSlot } from '@/types/chair';

interface ScheduleTimelineProps {
  chairs: Chair[];
  timeSlots: { chairId: string; slots: TimeSlot[] }[];
  selectedDate?: string;
  onSlotClick?: (chairId: string, slot: TimeSlot) => void;
}

const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  chairs,
  timeSlots,
  onSlotClick
}) => {
  const hours = Array.from({ length: 10 }, (_, i) => i + 8);

  return (
    <View className={styles.container}>
      <ScrollView scrollX className={styles.headerScroll}>
        <View className={styles.timelineHeader}>
          <View className={styles.timeHeader}>
            <Text className={styles.headerText}>时间</Text>
          </View>
          {chairs.map(chair => (
            <View key={chair.id} className={styles.chairHeader}>
              <Text className={styles.chairName}>{chair.name}</Text>
              <View className={classnames(styles.statusDot, {
                [styles.statusIdle]: chair.status === 'idle',
                [styles.statusBusy]: chair.status === 'busy',
                [styles.statusMaintenance]: chair.status === 'maintenance',
                [styles.statusOffline]: chair.status === 'offline'
              })} />
            </View>
          ))}
        </View>
      </ScrollView>

      <ScrollView scrollY className={styles.bodyScroll}>
        <View className={styles.timelineBody}>
          <View className={styles.timeColumn}>
            {hours.map(hour => (
              <View key={hour} className={styles.timeCell}>
                <Text className={styles.timeText}>{`${hour}:00`}</Text>
              </View>
            ))}
          </View>

          {chairs.map(chair => {
            const chairSlots = timeSlots.find(ts => ts.chairId === chair.id)?.slots || [];
            return (
              <View key={chair.id} className={styles.chairColumn}>
                {hours.map(hour => {
                  const slot = chairSlots.find(
                    s => s.startTime === `${hour.toString().padStart(2, '0')}:00`
                  );
                  return (
                    <View
                      key={hour}
                      className={classnames(styles.slotCell, {
                        [styles.slotAvailable]: slot?.available,
                        [styles.slotOccupied]: !slot?.available,
                        [styles.slotDisabled]: chair.status === 'offline' || chair.status === 'maintenance'
                      })}
                      onClick={() => {
                        if (slot?.available && chair.status !== 'offline' && chair.status !== 'maintenance') {
                          onSlotClick?.(chair.id, slot);
                        }
                      }}
                    >
                      {slot?.available && chair.status !== 'offline' && chair.status !== 'maintenance' && (
                        <View className={styles.slotAvailableIndicator} />
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default ScheduleTimeline;
