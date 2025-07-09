import React, { useEffect, useRef } from 'react';
// import adMobService from '../../services/adMobService'; // TODO: Uncomment when AdMob is installed

interface InterstitialAdTriggerProps {
  triggerOnMount?: boolean;
  triggerOnAction?: boolean;
  actionCompleted?: boolean;
  onAdShown?: () => void;
  onAdFailed?: () => void;
}

const InterstitialAdTrigger: React.FC<InterstitialAdTriggerProps> = ({
  triggerOnMount = false,
  triggerOnAction = false,
  actionCompleted = false,
  onAdShown,
  onAdFailed,
}) => {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (triggerOnMount && !hasTriggered.current) {
      showInterstitialAd();
    }
  }, [triggerOnMount]);

  useEffect(() => {
    if (triggerOnAction && actionCompleted && !hasTriggered.current) {
      showInterstitialAd();
    }
  }, [triggerOnAction, actionCompleted]);

  const showInterstitialAd = async () => {
    if (hasTriggered.current) return;

    try {
      // TODO: Uncomment when AdMob is installed
      // // Load the ad first
      // await adMobService.loadInterstitialAd();
      
      // // Add a slight delay to avoid jarring user experience
      // setTimeout(async () => {
      //   const shown = await adMobService.showInterstitialAd();
      //   hasTriggered.current = true;
      
      //   if (shown) {
      //     onAdShown?.();
      //   } else {
      //     onAdFailed?.();
      //   }
      // }, 1000); // 1 second delay

      // Placeholder implementation
              // Interstitial Ad would show here
      hasTriggered.current = true;
      onAdShown?.();
    } catch (error) {
      onAdFailed?.();
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default InterstitialAdTrigger; 