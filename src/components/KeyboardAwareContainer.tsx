import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';

interface KeyboardAwareContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  keyboardVerticalOffset?: number;
}

export const KeyboardAwareContainer: React.FC<KeyboardAwareContainerProps> = ({
  children,
  containerStyle,
  contentContainerStyle,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 64 : 0,
  ...rest
}) => {
  return (
    <KeyboardAvoidingView
      style={[styles.wrapper, containerStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        {...rest}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
