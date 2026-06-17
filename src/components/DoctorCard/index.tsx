import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Doctor } from '@/types/doctor';
import { getStatusText } from '@/utils/format';

interface DoctorCardProps {
  doctor: Doctor;
  onClick?: () => void;
  compact?: boolean;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onClick, compact = false }) => {
  const statusClass = classnames(styles.status, {
    [styles.onDuty]: doctor.status === 'onDuty',
    [styles.offDuty]: doctor.status === 'offDuty',
    [styles.leave]: doctor.status === 'leave'
  });

  return (
    <View
      className={classnames(styles.doctorCard, compact && styles.compact)}
      onClick={onClick}
    >
      <Image
        className={styles.avatar}
        src={doctor.avatar}
        mode="aspectFill"
      />

      <View className={styles.info}>
        <View className={styles.nameRow}>
          <Text className={styles.name}>{doctor.name}</Text>
          <View className={statusClass}>
            <Text className={styles.statusText}>{getStatusText(doctor.status)}</Text>
          </View>
        </View>

        <Text className={styles.title}>{doctor.title}</Text>
        <Text className={styles.specialty}>擅长：{doctor.specialty}</Text>

        {!compact && (
          <View className={styles.statsRow}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{doctor.todayPatients}</Text>
              <Text className={styles.statLabel}>今日接诊</Text>
            </View>
            {doctor.chairId && (
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{doctor.chairId.replace('chair-', '')}号</Text>
                <Text className={styles.statLabel}>坐诊牙椅</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default DoctorCard;
