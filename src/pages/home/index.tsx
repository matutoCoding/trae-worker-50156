import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import ChairCard from '@/components/ChairCard';
import QueueStatus from '@/components/QueueStatus';
import { useChairStore } from '@/store/useChairStore';
import { useQueueStore } from '@/store/useQueueStore';
import dayjs from 'dayjs';

const HomePage: React.FC = () => {
  const { chairs, fetchChairs, getChairById } = useChairStore();
  const {
    myNumber,
    getWaitingCount,
    getMyPosition,
    getMyChairInfo,
    queueInfo,
    callNextByChair
  } = useQueueStore();
  const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm'));
  const [callingChairId, setCallingChairId] = useState<string | null>(null);

  useEffect(() => {
    fetchChairs();
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('HH:mm'));
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchChairs]);

  const handleTakeNumber = () => {
    Taro.navigateTo({
      url: '/pages/take-number/index'
    });
  };

  const handleChairClick = (chairId: string) => {
    Taro.navigateTo({
      url: `/pages/chair-detail/index?id=${chairId}`
    });
  };

  const handleCallNext = (chairId: string, chairName: string) => {
    console.log(`[Home] 牙椅 ${chairName} 叫号`);
    setCallingChairId(chairId);

    const result = callNextByChair(chairId);

    if (result) {
      Taro.showToast({
        title: `${chairName} 叫号: ${result.number}号`,
        icon: 'none',
        duration: 2500
      });
      console.log(`[Home] 叫号成功: ${result.number} ${result.name}`);
    } else {
      Taro.showToast({
        title: `${chairName} 暂无等待患者`,
        icon: 'none'
      });
      console.log(`[Home] 牙椅 ${chairName} 无等待患者`);
    }

    setTimeout(() => setCallingChairId(null), 800);
  };

  const onPullDownRefresh = () => {
    fetchChairs();
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 1000);
  };

  useEffect(() => {
    Taro.eventCenter.on('pulldownrefresh', onPullDownRefresh);
    return () => {
      Taro.eventCenter.off('pulldownrefresh', onPullDownRefresh);
    };
  }, []);

  const waitingCount = getWaitingCount();
  const myPosition = getMyPosition();
  const myChairInfo = getMyChairInfo();

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>口腔诊疗中心</Text>
        <Text className={styles.subtitle}>
          {dayjs().format('YYYY年MM月DD日')} {currentTime}
        </Text>
      </View>

      <View className={styles.queueSection}>
        <QueueStatus
          myNumber={myNumber}
          position={myPosition}
          totalWaiting={queueInfo.totalWaiting}
          avgWaitTime={queueInfo.avgWaitTime}
          assignedChairName={myChairInfo?.chairName}
          chairPosition={myChairInfo?.chairPosition}
          onTakeNumber={handleTakeNumber}
        />
      </View>

      <View className={styles.chairSection}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleText}>牙椅状态</Text>
          <Text className={styles.sectionSubText}>
            共 {chairs.length} 台 · 空闲 {chairs.filter(c => c.status === 'idle').length} 台
          </Text>
        </View>

        <View className={styles.chairGrid}>
          {chairs.map(chair => (
            <View key={chair.id} className={styles.chairWrapper}>
              <ChairCard
                chair={chair}
                onClick={() => handleChairClick(chair.id)}
              />
              <View
                className={`${styles.callBtn} ${callingChairId === chair.id ? styles.callBtnActive : ''}`}
                onClick={(e) => {
                  e.stopPropagation?.();
                  if (chair.status !== 'offline' && chair.status !== 'maintenance') {
                    handleCallNext(chair.id, chair.name);
                  }
                }}
              >
                <Text className={styles.callBtnText}>
                  {chair.status === 'offline' || chair.status === 'maintenance' ? '停用中' : '叫下一位'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.takeNumberBtn} onClick={handleTakeNumber}>
        <Text className={styles.takeNumberBtnText}>立即取号</Text>
      </View>
    </ScrollView>
  );
};

export default HomePage;
