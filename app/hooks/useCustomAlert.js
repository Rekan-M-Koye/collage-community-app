import { useState, useCallback } from 'react';

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback((config) => {
    setAlertConfig({
      visible: true,
      type: config.type || 'info',
      title: config.title || '',
      message: config.message || '',
      buttons: config.buttons || [],
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  return {
    alertConfig,
    showAlert,
    hideAlert,
  };
};

export default useCustomAlert;
