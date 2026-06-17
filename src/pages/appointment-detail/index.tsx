import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useChairStore } from '@/store/useChairStore';
import { mockAppointments } from '@/data/mockAppointments';
import { getDoctorById } from '@/data/mockDoctors';
import { getStatusText } from '@/utils/format';
import type { Appointment } from '@/types/appointment';

const AppointmentDetailPage: React.FC = () => {
  const router = useRouter();
  const {
    getAppointmentById,
    cancelAppointment,
    appointments: storeAppointments
  } = useAppointmentStore();
  const { getChairById } = useChairStore();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isNewAppointment, setIsNewAppointment] = useState(false);

  useEffect(() => {
    const id = router.params.id;
    const isNew = router.params.new === '1';

    console.log('[ApptDetail] 加载预约:', id, '是否新预约:', isNew);

    if (id) {
      let appt = getAppointmentById(id);

      if (!appt) {
        appt = mockAppointments.find(a => a.id === id);
      }

      if (!appt) {
        console.log('[ApptDetail] 找不到预约，使用默认');
        appt = storeAppointments[storeAppointments.length - 1] || mockAppointments[0];
      }

      setAppointment(appt);
      setIsNewAppointment(isNew);
    } else {
      setAppointment(mockAppointments[0]);
    }
  }, [router.params.id, getAppointmentById, storeAppointments]);

  const handleCancel = () => {
    Taro.showModal({
      title: '取消预约',
      content: '确定要取消这个预约吗？',
      confirmColor: '#f5222d',
      success: (res) => {
        if (res.confirm) {
          if (appointment) {
            cancelAppointment(appointment.id);
            setAppointment(prev => prev ? { ...prev, status: 'cancelled' } : null);
          }
          Taro.showToast({ title: '已取消', icon: 'success' });
          setTimeout(() => {
            Taro.switchTab({
              url: '/pages/mine/index'
            });
          }, 1500);
        }
      }
    });
  };

  const handleReschedule = () => {
    Taro.showToast({ title: '改期功能开发中', icon: 'none' });
  };

  const handleConfirm = () => {
    Taro.showToast({ title: '已确认', icon: 'success' });
  };

  const handleBackToHome = () => {
    Taro.switchTab({
      url: '/pages/home/index'
    });
  };

  const handleViewMyAppointments = () => {
    Taro.switchTab({
      url: '/pages/mine/index'
    });
  };

  const doctor = useMemo(() => {
    if (!appointment) return null;
    if (appointment.doctorId) {
      const d = getDoctorById(appointment.doctorId);
      if (d) return d;
    }
    if (appointment.chairId) {
      const chair = getChairById(appointment.chairId);
      if (chair?.currentDoctorId) {
        return getDoctorById(chair.currentDoctorId);
      }
    }
    return null;
  }, [appointment, getChairById]);

  if (!appointment) {
    return (
      <View className={styles.page}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      {isNewAppointment && (
        <View className={styles.successBanner}>
          <View className={styles.successIcon}>✓</View>
          <View className={styles.successTextWrap}>
            <Text className={styles.successTitle}>预约成功</Text>
            <Text className={styles.successDesc}>系统已为您智能分配牙椅，详情请查看下方</Text>
          </View>
        </View>
      )}

      <View className={styles.headerCard}>
        <Text className={styles.apptType}>{appointment.type || '口腔门诊'}</Text>
        <View>
          <Text className={styles.apptStatus}>
            {getStatusText(appointment.status)}
          </Text>
        </View>
        <Text className={styles.apptId}>预约编号：{appointment.code || appointment.id}</Text>
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

        {appointment.chairName && (
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
        )}
      </View>

      <View className={styles.tipCard}>
        <Text className={styles.tipTitle}>温馨提示</Text>
        <Text className={styles.tipContent}>
          1. 请提前15分钟到达诊所，携带有效身份证件{'\n'}
          2. 如需改期或取消，请提前24小时操作{'\n'}
          3. 牙椅分配由系统智能调度，确保您获得最快的诊疗服务
        </Text>
      </View>

      {isNewAppointment && (
        <View className={styles.newApptActions}>
          <View
            className={`${styles.newActionBtn} ${styles.newActionBtnSecondary}`}
            onClick={handleViewMyAppointments}
          >
            <Text className={styles.newActionBtnSecondaryText}>查看我的预约</Text>
          </View>
          <View
            className={`${styles.newActionBtn} ${styles.newActionBtnPrimary}`}
            onClick={handleBackToHome}
          >
            <Text className={styles.newActionBtnPrimaryText}>返回首页</Text>
          </View>
        </View>
      )}

      {!isNewAppointment && appointment.status === 'confirmed' && (
        <View className={styles.bottomBar}>
          <View className={styles.btnSecondary} onClick={handleReschedule}>
            <Text className={styles.btnSecondaryText}>改期</Text>
          </View>
          <View className={styles.btnDanger} onClick={handleCancel}>
            <Text className={styles.btnDangerText}>取消预约</Text>
          </View>
        </View>
      )}

      {!isNewAppointment && appointment.status === 'pending' && (
        <View className={styles.bottomBar}>
          <View className={styles.btnDanger} onClick={handleCancel}>
            <Text className={styles.btnDangerText}>取消预约</Text>
          </View>
          <View className={styles.btnPrimary} onClick={handleConfirm}>
            <Text className={styles.btnPrimaryText}>确认预约</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default AppointmentDetailPage;
