import { useLanguage } from '../context/LanguageContext';

// Simple hook that returns just the translate function
// For when you only need 't' and don't need other language features
export const useTranslation = () => {
  const { t } = useLanguage();
  return { t };
};

export default useTranslation;
