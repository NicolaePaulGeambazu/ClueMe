import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors } from '../../constants/Colors';
import adMobService from '../../services/adMobService';

interface RewardedAdComponentProps {
  title?: string;
  description?: string;
  onRewardEarned?: (reward: any) => void;
  onAdClosed?: () => void;
  style?: any;
}

const RewardedAdComponent: React.FC<RewardedAdComponentProps> = ({
  title = 'Watch Ad for Bonus',
  description = 'Watch a short ad to unlock bonus features',
  onRewardEarned,
  onAdClosed,
  style,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    // Preload the rewarded ad
    loadRewardedAd();
  }, []);

  const loadRewardedAd = async () => {
    if (!adMobService.shouldShowAds()) {return;}

    try {
      setIsLoading(true);
      await adMobService.loadRewardedAd();
      setIsAdLoaded(true);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const showRewardedAd = async () => {
    if (!isAdLoaded) {
      Alert.alert('Ad Not Ready', 'Please wait a moment for the ad to load.');
      return;
    }

    try {
      setIsLoading(true);
      const shown = await adMobService.showRewardedAd();

      if (shown) {
        // Simulate reward (replace with actual reward logic)
        const reward = {
          type: 'bonus_feature',
          value: 'unlocked',
          timestamp: new Date().toISOString(),
        };

        onRewardEarned?.(reward);
        Alert.alert('Reward Earned!', 'You\'ve unlocked bonus features!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to show ad. Please try again.');
    } finally {
      setIsLoading(false);
      onAdClosed?.();
    }
  };

  // Don't show for premium users
  if (!adMobService.shouldShowAds()) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={showRewardedAd}
        disabled={isLoading || !isAdLoaded}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Loading...' : isAdLoaded ? 'Watch Ad' : 'Ad Loading...'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  buttonDisabled: {
    backgroundColor: Colors.light.textTertiary,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RewardedAdComponent;
