
import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { 
  useFluidTheme, 
  FluidContainer, 
  FluidText,
  useFluidAnimation 
} from '../../design-system';

export interface FluidModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  showCloseButton?: boolean;
  children: React.ReactNode;
}

export const FluidModal: React.FC<FluidModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  size = 'medium',
  showCloseButton = true,
  children,
}) => {
  const { colors, spacing, getShadowStyle } = useFluidTheme();
  const { 
    opacity, 
    scale, 
    translateY,
    startEntranceAnimation,
    startExitAnimation 
  } = useFluidAnimation({ initialValue: 0 });

  React.useEffect(() => {
    if (visible) {
      startEntranceAnimation();
    }
  }, [visible]);

  const handleClose = () => {
    startExitAnimation(() => {
      onClose();
    });
  };

  const getModalSize = () => {
    switch (size) {
      case 'small':
        return { width: '80%', maxHeight: '40%' };
      case 'medium':
        return { width: '90%', maxHeight: '60%' };
      case 'large':
        return { width: '95%', maxHeight: '80%' };
      case 'fullscreen':
        return { width: '100%', height: '100%' };
      default:
        return { width: '90%', maxHeight: '60%' };
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop */}
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            opacity,
            justifyContent: 'center',
            alignItems: 'center',
            padding: size === 'fullscreen' ? 0 : spacing.lg,
          }}
        >
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={handleClose}
            activeOpacity={1}
          />

          {/* Modal Content */}
          <Animated.View
            style={{
              ...getModalSize(),
              opacity,
              transform: [
                { scale },
                { translateY },
              ],
            }}
          >
            <FluidContainer
              background="surface"
              rounded={size === 'fullscreen' ? 'none' : 'large'}
              padding="large"
              shadow="xl"
              style={{ flex: 1 }}
            >
              {/* Header */}
              {(title || subtitle || showCloseButton) && (
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: spacing.lg,
                }}>
                  <View style={{ flex: 1 }}>
                    {title && (
                      <FluidText
                        variant="titleLarge"
                        weight="semibold"
                        style={{ marginBottom: subtitle ? spacing.xs : 0 }}
                      >
                        {title}
                      </FluidText>
                    )}
                    {subtitle && (
                      <FluidText
                        variant="bodyMedium"
                        color={colors.textSecondary}
                      >
                        {subtitle}
                      </FluidText>
                    )}
                  </View>

                  {showCloseButton && (
                    <TouchableOpacity
                      onPress={handleClose}
                      style={{
                        padding: spacing.sm,
                        marginTop: -spacing.sm,
                        marginRight: -spacing.sm,
                      }}
                    >
                      <X size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Content */}
              <View style={{ flex: 1 }}>
                {children}
              </View>
            </FluidContainer>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
