import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import type { Patient } from '@/types/patient';

interface QueueStatusProps {
  myNumber?: Patient | null;
  position?: number;
  totalWaiting?: number;
  avgWaitTime?: number;
  assignedChairName?: string;
  chairPosition?: number;
  onTakeNumber?: () => void;
}

const QueueStatus: React.FC<QueueStatusProps> = ({
  myNumber,
  position = 0,
  totalWaiting = 0,
  avgWaitTime = 0,
  assignedChairName,
  chairPosition = 0
}) => {
  return (
    <View className={styles.container}>
      <View className={styles.myNumberCard}>
        <View className={styles.numberHeader}>
          <Text className={styles.numberLabel}>我的号码</Text>
          {myNumber?.status === 'waiting' && chairPosition > 0 && (
            <View className={styles.positionBadge}>
              <Text className={styles.positionText}>本牙椅前方 {chairPosition - 1} 人</Text>
            </View>
          )}
        </View>

        <View className={styles.numberDisplay}>
          <Text className={styles.numberValue}>
            {myNumber ? myNumber.number : '--'}
          </Text>
          {myNumber && (
            <Text className={styles.department}>{myNumber.department}</Text>
          )}
        </View>

        {assignedChairName && (
          <View className={styles.chairInfo}>
            <View className={styles.chairBadge}>
              <Text className={styles.chairBadgeText}>分配牙椅</Text>
            </View>
            <Text className={styles.chairName}>{assignedChairName}</Text>
          </View>
        )}

        {myNumber && (
          <View className={styles.statusRow}>
            <View className={styles.statusItem}>
              <Text className={styles.statusLabel}>取号时间</Text>
              <Text className={styles.statusValue}>{myNumber.takeTime}</Text>
            </View>
            {myNumber.estimatedTime && (
              <View className={styles.statusItem}>
                <Text className={styles.statusLabel}>预计叫号</Text>
                <Text className={styles.statusValue}>{myNumber.estimatedTime}</Text>
              </View>
            )}
            {myNumber.chairId && (
              <View className={styles.statusItem}>
                <Text className={styles.statusLabel}>分配队列</Text>
                <Text className={styles.statusValue}>{assignedChairName || '系统分配中'}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statsCard}>
          <Text className={styles.statsValue}>{totalWaiting}</Text>
          <Text className={styles.statsLabel}>等待人数</Text>
        </View>
        <View className={styles.statsCard}>
          <Text className={styles.statsValue}>{avgWaitTime}</Text>
          <Text className={styles.statsLabel}>平均等待(分)</Text>
        </View>
        <View className={styles.statsCard}>
          <Text className={styles.statsValue}>6</Text>
          <Text className={styles.statsLabel}>开放牙椅</Text>
        </View>
      </View>
    </View>
  );
};

export default QueueStatus;
