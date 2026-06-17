import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { ScheduleTimeSlot } from '@/types/appointment';

interface TimeSlotPickerProps {
  slots: ScheduleTimeSlot[];
  selectedSlotId?: string;
  onSelect?: (slot: ScheduleTimeSlot) => void;
  columns?: number;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  slots,
  selectedSlotId,
  onSelect,
  columns = 4
}) => {
  return (
    <View className={styles.container}>
      <View
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {slots.map(slot => (
          <View
            key={slot.id}
            className={classnames(styles.slot, {
              [styles.selected]: slot.id === selectedSlotId,
              [styles.disabled]: !slot.available || slot.availableChairs === 0,
              [styles.full]: !slot.available
            })}
            onClick={() => {
              if (slot.available && slot.availableChairs > 0) {
                onSelect?.(slot);
              }
            }}
          >
            <Text className={styles.timeText}>{slot.time}</Text>
            {slot.available && slot.availableChairs > 0 ? (
              <Text className={styles.availableText}>
                {slot.availableChairs}位可约
              </Text>
            ) : (
              <Text className={styles.fullText}>已约满</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default TimeSlotPicker;
