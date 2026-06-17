import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface LoadBalanceBarProps {
  label: string;
  value: number;
  max?: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LoadBalanceBar: React.FC<LoadBalanceBarProps> = ({
  label,
  value,
  max = 100,
  showValue = true,
  size = 'md'
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const loadLevel = percentage < 40 ? 'low' : percentage < 70 ? 'medium' : 'high';

  return (
    <View className={classnames(styles.container, styles[size])}>
      <View className={styles.header}>
        <Text className={styles.label}>{label}</Text>
        {showValue && (
          <Text className={classnames(styles.value, styles[loadLevel])}>
            {Math.round(value)}
          </Text>
        )}
      </View>
      <View className={styles.bar}>
        <View
          className={classnames(styles.fill, styles[loadLevel])}
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
};

export default LoadBalanceBar;
