import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import DoctorCard from '@/components/DoctorCard';
import { mockDoctors, getDoctorsByStatus } from '@/data/mockDoctors';
import dayjs from 'dayjs';
import type { Doctor } from '@/types/doctor';

const RosterPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(0);

  const weekDays = useMemo(() => {
    const days = [];
    const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    for (let i = 0; i < 7; i++) {
      const date = dayjs().add(i, 'day');
      days.push({
        date: date.format('YYYY-MM-DD'),
        weekday: i === 0 ? '今天' : weekdayMap[date.day()],
        day: date.date(),
        month: date.month() + 1
      });
    }
    return days;
  }, []);

  const onDutyDoctors = useMemo(() => {
    return getDoctorsByStatus('onDuty');
  }, []);

  const offDutyDoctors = useMemo(() => {
    return getDoctorsByStatus('offDuty');
  }, []);

  const chairRoster = useMemo(() => {
    return mockDoctors
      .filter(d => d.chairId)
      .sort((a, b) => {
        const aNum = parseInt(a.chairId?.replace('chair-', '') || '0');
        const bNum = parseInt(b.chairId?.replace('chair-', '') || '0');
        return aNum - bNum;
      });
  }, []);

  const handleDoctorClick = (doctor: Doctor) => {
    Taro.showToast({
      title: `${doctor.name} - ${doctor.title}`,
      icon: 'none'
    });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.dateSelector}>
        <ScrollView scrollX className={styles.dateScroll}>
          {weekDays.map((day, index) => (
            <View
              key={day.date}
              className={classnames(styles.dateItem, {
                [styles.active]: index === selectedDate
              })}
              onClick={() => setSelectedDate(index)}
            >
              <Text className={styles.weekday}>{day.weekday}</Text>
              <Text className={styles.dateDay}>{day.day}</Text>
              <Text className={styles.dateNum}>{day.month}月</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.statsBar}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{onDutyDoctors.length}</Text>
          <Text className={styles.statLabel}>在岗医生</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{chairRoster.length}</Text>
          <Text className={styles.statLabel}>坐诊牙椅</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>
            {onDutyDoctors.reduce((sum, d) => sum + d.todayPatients, 0)}
          </Text>
          <Text className={styles.statLabel}>今日接诊</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.shiftSection}>
          <View className={styles.shiftTitle}>
            <View className={styles.shiftIcon} />
            <Text className={styles.shiftName}>白班</Text>
            <Text className={styles.shiftTime}>08:00 - 17:30</Text>
          </View>

          {onDutyDoctors.length > 0 ? (
            <View className={styles.doctorList}>
              {onDutyDoctors.map(doctor => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onClick={() => handleDoctorClick(doctor)}
                />
              ))}
            </View>
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyText}>暂无值班医生</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.chairRosterSection}>
        <Text className={styles.chairRosterTitle}>牙椅-医生对照表</Text>
        <View className={styles.chairRosterList}>
          {chairRoster.map(doctor => (
            <View
              key={doctor.id}
              className={styles.chairRosterItem}
              onClick={() => handleDoctorClick(doctor)}
            >
              <View className={styles.chairNum}>
                <Text className={styles.chairNumText}>
                  {doctor.chairId?.replace('chair-00', '')}
                </Text>
              </View>
              <View className={styles.chairInfo}>
                <Text className={styles.doctorName}>{doctor.name}</Text>
                <Text className={styles.doctorTitle}>
                  {doctor.title} · {doctor.specialty}
                </Text>
              </View>
              <View className={styles.chairStatus}>
                <Text className={classnames(styles.statusText, {
                  [styles.onDuty]: doctor.status === 'onDuty',
                  [styles.offDuty]: doctor.status !== 'onDuty'
                })}>
                  {doctor.status === 'onDuty' ? '在岗' : '离岗'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {offDutyDoctors.length > 0 && (
        <View className={styles.section}>
          <View className={styles.shiftSection}>
            <View className={styles.shiftTitle}>
              <View className={styles.shiftIcon} />
              <Text className={styles.shiftName}>休息医生</Text>
            </View>

            <View className={styles.doctorList}>
              {offDutyDoctors.map(doctor => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onClick={() => handleDoctorClick(doctor)}
                />
              ))}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default RosterPage;
