import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useUserStore } from '@/store/useUserStore';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { getStatusText } from '@/utils/format';

const MinePage: React.FC = () => {
  const { userInfo, logout } = useUserStore();
  const { getMyAppointments } = useAppointmentStore();

  const myAppointments = useMemo(() => getMyAppointments(), [getMyAppointments]);

  const handleAppointmentClick = (id: string) => {
    Taro.navigateTo({
      url: `/pages/appointment-detail/index?id=${id}`
    });
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout();
          Taro.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  };

  const handleMenuClick = (menu: string) => {
    Taro.showToast({ title: `${menu}功能开发中`, icon: 'none' });
  };

  const recentAppointments = myAppointments.slice(0, 5);

  const pendingCount = myAppointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length;
  const completedCount = myAppointments.filter(a => a.status === 'completed').length;

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      pending: 'pending',
      confirmed: 'confirmed',
      completed: 'completed',
      cancelled: 'cancelled'
    };
    return map[status] || '';
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.profileHeader}>
        <View className={styles.profileInfo}>
          <Image
            className={styles.avatar}
            src={userInfo?.avatar || 'https://picsum.photos/id/64/200/200'}
            mode="aspectFill"
          />
          <View className={styles.userInfo}>
            <Text className={styles.userName}>{userInfo?.name || '张小明'}</Text>
            <Text className={styles.userPhone}>{userInfo?.phone || '138****0000'}</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statsItem}>
          <Text className={styles.statsNum}>{myAppointments.length}</Text>
          <Text className={styles.statsLabel}>预约</Text>
        </View>
        <View className={styles.statsItem}>
          <Text className={styles.statsNum}>{completedCount}</Text>
          <Text className={styles.statsLabel}>就诊</Text>
        </View>
        <View className={styles.statsItem}>
          <Text className={styles.statsNum}>{pendingCount}</Text>
          <Text className={styles.statsLabel}>待就诊</Text>
        </View>
      </View>

      <View className={styles.menuSection}>
        <Text className={styles.menuTitle}>我的服务</Text>
        <View
          className={styles.menuItem}
          onClick={() => handleMenuClick('我的预约')}
        >
          <View className={`${styles.menuIcon} ${styles.iconAppointment}`}>
            <Text>📅</Text>
          </View>
          <Text className={styles.menuText}>我的预约</Text>
          <View className={styles.menuBadge}>
            <Text className={styles.menuBadgeText}>{pendingCount}</Text>
          </View>
          <Text className={styles.menuArrow}>{'>'}</Text>
        </View>
        <View
          className={styles.menuItem}
          onClick={() => handleMenuClick('就诊记录')}
        >
          <View className={`${styles.menuIcon} ${styles.iconRecord}`}>
            <Text>📋</Text>
          </View>
          <Text className={styles.menuText}>就诊记录</Text>
          <Text className={styles.menuArrow}>{'>'}</Text>
        </View>
        <View
          className={styles.menuItem}
          onClick={() => Taro.switchTab({ url: '/pages/home/index' })}
        >
          <View className={`${styles.menuIcon} ${styles.iconQueue}`}>
            <Text>🔢</Text>
          </View>
          <Text className={styles.menuText}>我的排队</Text>
          <Text className={styles.menuArrow}>{'>'}</Text>
        </View>
      </View>

      <View className={styles.menuSection}>
        <Text className={styles.menuTitle}>其他</Text>
        <View
          className={styles.menuItem}
          onClick={() => handleMenuClick('设置')}
        >
          <View className={`${styles.menuIcon} ${styles.iconSettings}`}>
            <Text>⚙️</Text>
          </View>
          <Text className={styles.menuText}>设置</Text>
          <Text className={styles.menuArrow}>{'>'}</Text>
        </View>
        <View
          className={styles.menuItem}
          onClick={() => handleMenuClick('帮助与反馈')}
        >
          <View className={`${styles.menuIcon} ${styles.iconHelp}`}>
            <Text>💬</Text>
          </View>
          <Text className={styles.menuText}>帮助与反馈</Text>
          <Text className={styles.menuArrow}>{'>'}</Text>
        </View>
        <View
          className={styles.menuItem}
          onClick={() => handleMenuClick('关于我们')}
        >
          <View className={`${styles.menuIcon} ${styles.iconAbout}`}>
            <Text>ℹ️</Text>
          </View>
          <Text className={styles.menuText}>关于我们</Text>
          <Text className={styles.menuArrow}>{'>'}</Text>
        </View>
      </View>

      <View className={styles.appointmentList}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>最近预约</Text>
          <Text className={styles.sectionMore} onClick={() => handleMenuClick('全部预约')}>
            查看全部
          </Text>
        </View>

        {recentAppointments.length === 0 && (
          <View className={styles.emptyTip}>
            <Text className={styles.emptyTipText}>暂无预约记录，快去预约吧~</Text>
          </View>
        )}

        {recentAppointments.map(appt => (
          <View
            key={appt.id}
            className={styles.appointmentCard}
            onClick={() => handleAppointmentClick(appt.id)}
          >
            <View className={styles.apptHeader}>
              <Text className={styles.apptType}>{appt.type || appt.department}</Text>
              <Text className={classnames(styles.apptStatus, styles[getStatusClass(appt.status)])}>
                {getStatusText(appt.status)}
              </Text>
            </View>
            <View className={styles.apptContent}>
              <View className={styles.apptInfo}>
                <Text className={styles.apptTime}>
                  {appt.date} {appt.startTime} - {appt.endTime}
                </Text>
                <Text className={styles.apptChair}>{appt.chairName || '系统分配中'}</Text>
              </View>
              {appt.doctorName && (
                <View className={styles.apptDoctor}>
                  <Text className={styles.doctorName}>{appt.doctorName}</Text>
                  <Text className={styles.doctorTitle}>医生</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      <View className={styles.logoutBtn} onClick={handleLogout}>
        <Text className={styles.logoutBtnText}>退出登录</Text>
      </View>
    </ScrollView>
  );
};

export default MinePage;
