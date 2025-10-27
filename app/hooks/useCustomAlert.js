import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export const useCustomAlert = () => {
  const showAlert = useCallback((title, message, type = 'info') => {
    Alert.alert(title, message);
  }, []);

  return {
    showAlert,
  };
};

export default useCustomAlert;
