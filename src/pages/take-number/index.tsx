import React, { useState, useEffect } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useChairStore } from '@/store/useChairStore';
import { useQueueStore } from '@/store/useQueueStore';
import { findBestChair } from '@/utils/loadBalancer';
import type { Patient } from '@/types/patient';

const departments = [
  { id: 'general', name: '口腔综合', desc: '常规检查、补牙等' },
  { id: 'orthodontics', name: '正畸科', desc: '牙齿矫正、隐形矫治' },
  { id: 'implant', name: '种植科', desc: '种植牙、植骨手术' },
  { id: 'endodontics', name: '牙体牙髓', desc: '根管治疗、牙体修复' },
  { id: 'periodontics', name: '牙周科', desc: '牙周炎、牙龈治疗' },
  { id: 'pediatrics', name: '儿童口腔', desc: '儿童齿科、预防保健' }
];

interface TakeResult {
  patient: Patient;
  allocation: {
    chairId: string;
    chairName: string;
    estimatedWaitTime: number;
    reason: string;
  } | null;
}

const TakeNumberPage: React.FC = () => {
  const { chairs, getChairById } = useChairStore();
  const { takeNumber, getWaitingByChair } = useQueueStore();

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [selectedDept, setSelectedDept] = useState('general');
  const [allocation, setAllocation] = useState<ReturnType<typeof findBestChair>>(null);
  const [takeResult, setTakeResult] = useState<TakeResult | null>(null);

  useEffect(() => {
    const result = findBestChair(chairs);
    setAllocation(result);
  }, [chairs]);

  const handleSubmit = () => {
    if (!patientName.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!patientPhone.trim()) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '确认取号',
      content: `确认挂${departments.find(d => d.id === selectedDept)?.name}的号吗？`,
      success: (res) => {
        if (res.confirm) {
          const result = takeNumber({
            name: patientName,
            phone: patientPhone,
            department: departments.find(d => d.id === selectedDept)?.name || '口腔科'
          });

          console.log('[TakeNumber] 取号结果:', result);
          setTakeResult(result);
        }
      }
    });
  };

  const handleBackHome = () => {
    Taro.switchTab({
      url: '/pages/home/index'
    });
  };

  const handleViewChair = () => {
    if (takeResult?.allocation) {
      Taro.navigateTo({
        url: `/pages/chair-detail/index?id=${takeResult.allocation.chairId}`
      });
    }
  };

  if (takeResult) {
    const chairQueue = takeResult.allocation
      ? getWaitingByChair(takeResult.allocation.chairId)
      : [];
    const myIndex = chairQueue.findIndex(p => p.id === takeResult.patient.id);
    const chair = takeResult.allocation ? getChairById(takeResult.allocation.chairId) : undefined;

    return (
      <View className={styles.page}>
        <View className={styles.successContainer}>
          <View className={styles.successIcon}>✓</View>
          <Text className={styles.successTitle}>取号成功</Text>
          <Text className={styles.successSubtitle}>系统已为您智能分配最优牙椅</Text>

          <View className={styles.resultCard}>
            <View className={styles.resultRow}>
              <Text className={styles.resultLabel}>我的号码</Text>
              <Text className={styles.resultNumber}>#{takeResult.patient.number}</Text>
            </View>
            <View className={styles.resultRow}>
              <Text className={styles.resultLabel}>姓名</Text>
              <Text className={styles.resultValue}>{takeResult.patient.name}</Text>
            </View>
            <View className={styles.resultRow}>
              <Text className={styles.resultLabel}>科室</Text>
              <Text className={styles.resultValue}>{takeResult.patient.department}</Text>
            </View>
            <View className={styles.resultDivider} />

            {takeResult.allocation && (
              <>
                <View className={styles.allocationHighlight}>
                  <View className={styles.allocationIcon}>🎯</View>
                  <View className={styles.allocationDetails}>
                    <Text className={styles.allocationLabel}>分配牙椅</Text>
                    <Text className={styles.allocationChair}>{takeResult.allocation.chairName}</Text>
                  </View>
                  <View className={styles.allocationReasonBadge}>
                    <Text className={styles.reasonText}>智能分配</Text>
                  </View>
                </View>

                <View className={styles.chairStats}>
                  <View className={styles.chairStatItem}>
                    <Text className={styles.chairStatValue}>
                      {chair?.waitCount ?? '--'}
                    </Text>
                    <Text className={styles.chairStatLabel}>该牙椅等待</Text>
                  </View>
                  <View className={styles.chairStatDivider} />
                  <View className={styles.chairStatItem}>
                    <Text className={styles.chairStatValue}>
                      {myIndex === -1 ? '即将' : `${myIndex + 1}`}
                    </Text>
                    <Text className={styles.chairStatLabel}>您的位次</Text>
                  </View>
                  <View className={styles.chairStatDivider} />
                  <View className={styles.chairStatItem}>
                    <Text className={styles.chairStatValue}>
                      {takeResult.allocation.estimatedWaitTime === 0
                        ? '即到'
                        : `≈${takeResult.allocation.estimatedWaitTime}分`}
                    </Text>
                    <Text className={styles.chairStatLabel}>预计等待</Text>
                  </View>
                </View>

                <View className={styles.reasonRow}>
                  <Text className={styles.reasonLabel}>分配策略</Text>
                  <Text className={styles.reasonDesc}>{takeResult.allocation.reason}</Text>
                </View>
              </>
            )}
          </View>

          <View className={styles.actionButtons}>
            <View
              className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
              onClick={handleViewChair}
            >
              <Text className={styles.actionBtnSecondaryText}>查看牙椅详情</Text>
            </View>
            <View
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={handleBackHome}
            >
              <Text className={styles.actionBtnPrimaryText}>返回首页</Text>
            </View>
          </View>

          <View className={styles.tipsCard}>
            <Text className={styles.tipsTitle}>温馨提示</Text>
            <Text className={styles.tipsContent}>
              请留意广播叫号，也可点击"查看牙椅详情"实时了解排队进度。如长时间未叫号，请咨询前台工作人员。
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>患者信息</Text>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>姓名</Text>
          <Input
            className={styles.formInput}
            placeholder="请输入您的姓名"
            value={patientName}
            onInput={(e) => setPatientName(e.detail.value)}
            maxlength={20}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>手机号</Text>
          <Input
            className={styles.formInput}
            type="number"
            placeholder="请输入手机号码"
            value={patientPhone}
            onInput={(e) => setPatientPhone(e.detail.value)}
            maxlength={11}
          />
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>选择科室</Text>
        <View className={styles.departmentList}>
          {departments.map(dept => (
            <View
              key={dept.id}
              className={classnames(styles.departmentItem, {
                [styles.active]: dept.id === selectedDept
              })}
              onClick={() => setSelectedDept(dept.id)}
            >
              <Text className={styles.deptName}>{dept.name}</Text>
              <Text className={styles.deptDesc}>{dept.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {allocation && (
        <View className={styles.allocationPreview}>
          <Text className={styles.allocationTitle}>
            智能分配
            <Text className={styles.allocationBadge}>负载均衡</Text>
          </Text>
          <View className={styles.allocationContent}>
            <View className={styles.allocationChair}>
              <Text className={styles.chairName}>{allocation.chairName}</Text>
              <Text className={styles.chairReason}>{allocation.reason}</Text>
            </View>
            <View className={styles.allocationScore}>
              <Text className={styles.scoreValue}>
                {allocation.estimatedWaitTime === 0 ? '即到' : `${allocation.estimatedWaitTime}分`}
              </Text>
              <Text className={styles.scoreLabel}>预计等待</Text>
            </View>
          </View>
        </View>
      )}

      <View className={styles.tips}>
        <Text className={styles.tipsText}>
          温馨提示：系统将根据各牙椅负载情况自动为您分配最优牙椅，无需手动选择。如对分配结果有疑问，请咨询前台。
        </Text>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.feeInfo}>
          <Text className={styles.feeLabel}>挂号费</Text>
          <Text className={styles.feeValue}>¥ 15.00</Text>
        </View>
        <View className={styles.confirmBtn} onClick={handleSubmit}>
          <Text className={styles.confirmBtnText}>确认取号</Text>
        </View>
      </View>
    </View>
  );
};

export default TakeNumberPage;
