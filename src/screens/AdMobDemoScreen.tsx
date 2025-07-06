import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../constants/Colors';
import { Fonts, FontSizes } from '../constants/Fonts';
import BannerAdComponent from '../components/ads/BannerAdComponent';
import InterstitialAdTrigger from '../components/ads/InterstitialAdTrigger';
import RewardedAdComponent from '../components/ads/RewardedAdComponent';
import { useAdMob } from '../hooks/useAdMob';
import { 
  Play, 
  Square, 
  Star, 
  Crown, 
  Settings,
  ArrowLeft,
  Zap,
  Bell,
  Users
} from 'lucide-react-native';

export default function AdMobDemoScreen({ navigation }: any) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { shouldShowAds, isLoading, showInterstitialAd, showRewardedAd, adStats } = useAdMob();
  const [interstitialTriggered, setInterstitialTriggered] = useState(false);
  const [rewardEarned, setRewardEarned] = useState(false);

  const handleShowInterstitial = async () => {
    const shown = await showInterstitialAd();
    if (shown) {
      Alert.alert('Success', 'Interstitial ad shown successfully!');
    } else {
      Alert.alert('Info', 'Interstitial ad not available or skipped due to frequency limits.');
    }
  };

  const handleShowRewarded = async () => {
    const shown = await showRewardedAd();
    if (shown) {
      setRewardEarned(true);
      Alert.alert('Reward Earned!', 'You\'ve unlocked bonus features!');
    } else {
      Alert.alert('Info', 'Rewarded ad not available.');
    }
  };

  const handleTogglePremium = () => {
    Alert.alert(
      'Toggle Premium Status',
      'This would toggle between free and premium user status for testing ad behavior.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Toggle', onPress: () => Alert.alert('Info', 'Premium status toggle would be implemented here.') }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>AdMob Demo</Text>
        <TouchableOpacity onPress={handleTogglePremium} style={styles.premiumButton}>
          <Crown size={20} color={shouldShowAds ? colors.textSecondary : '#FFD700'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ad Status</Text>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Ads Enabled:</Text>
            <Text style={[styles.statusValue, { color: shouldShowAds ? colors.success : colors.error }]}>
              {shouldShowAds ? 'Yes' : 'No (Premium)'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Interstitials Shown:</Text>
            <Text style={[styles.statusValue, { color: colors.text }]}>{adStats.interstitialShownCount}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Last Interstitial:</Text>
            <Text style={[styles.statusValue, { color: colors.text }]}>
              {adStats.lastInterstitialTime ? new Date(adStats.lastInterstitialTime).toLocaleTimeString() : 'Never'}
            </Text>
          </View>
        </View>

        {/* Banner Ad Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Banner Ad</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Banner ads are shown at the bottom of screens for free users.
          </Text>
          <BannerAdComponent style={styles.bannerAd} />
        </View>

        {/* Interstitial Ad Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Interstitial Ad</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Full-screen ads shown after major actions (max once every 3 minutes).
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleShowInterstitial}
            disabled={isLoading}
          >
            <Play size={20} color="white" />
            <Text style={styles.actionButtonText}>
              {isLoading ? 'Loading...' : 'Show Interstitial'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Rewarded Ad Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Rewarded Ad</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Watch ads to unlock bonus features and rewards.
          </Text>
          <RewardedAdComponent
            title="Unlock Premium Features"
            description="Watch a short ad to unlock advanced themes and templates"
            onRewardEarned={(reward) => {
              setRewardEarned(true);
              console.log('Reward earned:', reward);
            }}
            style={styles.rewardedAd}
          />
        </View>

        {/* Ad Placement Examples */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended Ad Placements</Text>
          
          <View style={styles.placementItem}>
            <Bell size={20} color={colors.primary} />
            <View style={styles.placementContent}>
              <Text style={[styles.placementTitle, { color: colors.text }]}>Home Screen</Text>
              <Text style={[styles.placementDescription, { color: colors.textSecondary }]}>
                Banner at bottom, interstitial after reminder creation
              </Text>
            </View>
          </View>

          <View style={styles.placementItem}>
            <Settings size={20} color={colors.secondary} />
            <View style={styles.placementContent}>
              <Text style={[styles.placementTitle, { color: colors.text }]}>Settings Screen</Text>
              <Text style={[styles.placementDescription, { color: colors.textSecondary }]}>
                Banner at bottom, interstitial after profile updates
              </Text>
            </View>
          </View>

          <View style={styles.placementItem}>
            <Users size={20} color={colors.tertiary} />
            <View style={styles.placementContent}>
              <Text style={[styles.placementTitle, { color: colors.text }]}>Family Screen</Text>
              <Text style={[styles.placementDescription, { color: colors.textSecondary }]}>
                Banner at bottom, interstitial after family actions
              </Text>
            </View>
          </View>
        </View>

        {/* Premium Upsell */}
        {shouldShowAds && (
          <View style={[styles.section, { backgroundColor: colors.primary + '10' }]}>
            <View style={styles.upsellHeader}>
              <Crown size={24} color={colors.primary} />
              <Text style={[styles.upsellTitle, { color: colors.text }]}>Upgrade to Pro</Text>
            </View>
            <Text style={[styles.upsellDescription, { color: colors.textSecondary }]}>
              Get an ad-free experience with unlimited reminders and premium features.
            </Text>
            <TouchableOpacity style={[styles.upsellButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.upsellButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Interstitial Trigger for Demo */}
        <InterstitialAdTrigger
          triggerOnAction={true}
          actionCompleted={interstitialTriggered}
          onAdShown={() => setInterstitialTriggered(false)}
          onAdFailed={() => setInterstitialTriggered(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: FontSizes.title2,
    fontFamily: Fonts.text.bold,
    fontWeight: '600',
  },
  premiumButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: FontSizes.title3,
    fontFamily: Fonts.text.bold,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.regular,
    marginBottom: 16,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.regular,
  },
  statusValue: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.semibold,
  },
  bannerAd: {
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.semibold,
    fontWeight: '600',
  },
  rewardedAd: {
    marginTop: 16,
  },
  placementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  placementContent: {
    flex: 1,
    marginLeft: 12,
  },
  placementTitle: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.semibold,
    fontWeight: '600',
    marginBottom: 4,
  },
  placementDescription: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.regular,
    lineHeight: 16,
  },
  upsellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  upsellTitle: {
    fontSize: FontSizes.title3,
    fontFamily: Fonts.text.bold,
    fontWeight: '600',
    marginLeft: 8,
  },
  upsellDescription: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.regular,
    marginBottom: 16,
    lineHeight: 20,
  },
  upsellButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  upsellButtonText: {
    color: 'white',
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.semibold,
    fontWeight: '600',
  },
}); 