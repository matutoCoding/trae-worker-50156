import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Chair } from '@/types/chair';
import { getStatusText } from '@/utils/format';
import { useChairStore } from '@/store/useChairStore';
import { useAppointmentStore } from '@/store/useAppointmentStore';

interface ChairCardProps {
  chair: Chair;
  onClick?: () => void;
  compact?: boolean;
}

const ChairCard: React.FC<ChairCardProps> = ({ chair, onClick, compact = false }) => {
  const { getTodayAppointmentsCount, getTodayOccupiedMinutes } = useChairStore();
  const { appointments } = useAppointmentStore();

  const stats = useMemo(() => {
    const count = getTodayAppointmentsCount(chair.id);
    const minutes = getTodayOccupiedMinutes(chair.id);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeStr = hours > 0
      ? `${hours}h${mins > 0 ? `${mins}m` : ''}`
      : `${mins}m`;
    return { count, timeStr, minutes };
  }, [chair.id, appointments, getTodayAppointmentsCount, getTodayOccupiedMinutes]);

  const statusClass = classnames(styles.status, {
    [styles.statusIdle]: chair.status === 'idle',
    [styles.statusBusy]: chair.status === 'busy',
    [styles.statusMaintenance]: chair.status === 'maintenance',
    [styles.statusOffline]: chair.status === 'offline'
  });

  return (
    <View
      className={classnames(styles.chairCard, compact && styles.compact)}
      onClick={onClick}
    >
      <View className={styles.header}>
        <Text className={styles.chairName}>{chair.name}</Text>
        <View className={statusClass}>
          <Text className={styles.statusText}>{getStatusText(chair.status)}</Text>
        </View>
      </View>

      {!compact && (
        <>
          {chair.status === 'busy' && chair.currentPatient && (
            <View className={styles.currentPatient}>
              <Text className={styles.patientLabel}>当前患者</Text>
              <Text className={styles.patientName}>{chair.currentPatient}</Text>
              <Text className={styles.patientNumber}>#{chair.currentNumber}</Text>
            </View>
          )}

          <View className={styles.statsRow}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{chair.waitCount}</Text>
              <Text className={styles.statLabel}>等待</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{chair.todayTotal}</Text>
              <Text className={styles.statLabel}>今日</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{chair.loadRate}%</Text>
              <Text className={styles.statLabel}>负载</Text>
            </View>
          </View>

          <View className={styles.loadBar}>
            <View
              className={classnames(styles.loadFill, {
                [styles.loadLow]: chair.loadRate < 40,
                [styles.loadMedium]: chair.loadRate >= 40 && chair.loadRate < 70,
                [styles.loadHigh]: chair.loadRate >= 70
              })}
              style={{ width: `${chair.loadRate}%` }}
            />
          </View>

          {stats.count > 0 && (
            <View className={styles.appointmentInfo}>
              <Text className={styles.appointmentCount}>📅 今日 {stats.count} 个预约</Text>
              <Text className={styles.appointmentTime}>占用 {stats.timeStr}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default ChairCard;
