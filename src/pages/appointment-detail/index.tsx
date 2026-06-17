import React, { useState, useEffect } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { mockAppointments, getAppointmentById } from '@/data/mockAppointments';
import { getDoctorById } from '@/data/mockDoctors';
import { getStatusText } from '@/utils/format';
import type { Appointment } from '@/types/appointment';

const AppointmentDetailPage: React.FC = () => {
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    const id = router.params.id;
    if (id) {
      const appt = getAppointmentById(id) || mockAppointments[0];
      setAppointment(appt);
    } else {
      setAppointment(mockAppointments[0]);
    }
  }, [router.params.id]);

  const handleCancel = () => {
    Taro.showModal({
      title: '取消预约',
      content: '确定要取消这个预约吗？',
      confirmColor: '#f5222d',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已取消', icon: 'success' });
          setTimeout(() => {
            Taro.navigateBack();
          }, 1500);
        }
      }
    });
  };

  const handleReschedule = () => {
    Taro.showToast({ title: '改期功能开发中', icon: 'none' });
  };

  if (!appointment) {
    return (
      <View className={styles.page}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const doctor = appointment.doctorId ? getDoctorById(appointment.doctorId) : null;

  return (
    <View className={styles.page}>
      <View className={styles.headerCard}>
        <Text className={styles.apptType}>{appointment.type}</Text>
        <View>
          <Text className={styles.apptStatus}>
            {getStatusText(appointment.status)}
          </Text>
        </View>
        <Text className={styles.apptId}>预约编号：{appointment.id}</Text>
      </View>

      <View className={styles.infoCard}>
        <Text className={styles.infoTitle}>预约信息</Text>

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>预约时间</Text>
          <Text className={styles.infoValue}>
            {appointment.date} {appointment.startTime} - {appointment.endTime}
          </Text>
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>科室</Text>
          <Text className={styles.infoValue}>{appointment.department}</Text>
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>患者姓名</Text>
          <Text className={styles.infoValue}>{appointment.patientName}</Text>
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>联系电话</Text>
          <Text className={styles.infoValue}>{appointment.patientPhone}</Text>
        </View>

        {doctor && (
          <View className={styles.doctorInfo}>
            <Image
              className={styles.doctorAvatar}
              src={doctor.avatar}
              mode="aspectFill"
            />
            <View className={styles.doctorDetail}>
              <Text className={styles.doctorName}>{doctor.name}</Text>
              <Text className={styles.doctorTitle}>
                {doctor.title} · {doctor.specialty}
              </Text>
            </View>
          </View>
        )}

        <View className={styles.chairInfo}>
          <View className={styles.chairIcon}>
            <Text>🦷</Text>
          </View>
          <View className={styles.chairDetail}>
            <Text className={styles.chairName}>{appointment.chairName}</Text>
            <Text className={styles.chairDesc}>智能分配 · 负载均衡</Text>
          </View>
          <Text className={styles.allocationBadge}>最优分配</Text>
        </View>
      </View>

      <View className={styles.tipCard}>
        <Text className={styles.tipTitle}>温馨提示</Text>
        <Text className={styles.tipContent}>
          1. 请提前15分钟到达诊所，携带有效身份证件{'\n'}
          2. 如需改期或取消，请提前24小时操作{'\n'}
          3. 牙椅分配由系统智能调度，确保您获得最快的诊疗服务
        </Text>
      </View>

      {appointment.status === 'confirmed' && (
        <View className={styles.bottomBar}>
          <View className={styles.btnSecondary} onClick={handleReschedule}>
            <Text className={styles.btnSecondaryText}>改期</Text>
          </View>
          <View className={styles.btnDanger} onClick={handleCancel}>
            <Text className={styles.btnDangerText}>取消预约</Text>
          </View>
        </View>
      )}

      {appointment.status === 'pending' && (
        <View className={styles.bottomBar}>
          <View className={styles.btnDanger} onClick={handleCancel}>
            <Text className={styles.btnDangerText}>取消预约</Text>
          </View>
          <View className={styles.btnPrimary} onClick={() => Taro.showToast({ title: '已确认', icon: 'success' })}>
            <Text className={styles.btnPrimaryText}>确认预约</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default AppointmentDetailPage;
