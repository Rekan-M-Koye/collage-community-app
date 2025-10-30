export const handleNetworkError = (error) => {
  if (!error) {
    return {
      isNetworkError: false,
      message: 'Unknown error occurred'
    };
  }

  const errorString = error.toString().toLowerCase();
  const errorMessage = error.message?.toLowerCase() || '';
  
  const isNetworkError = 
    errorString.includes('network') ||
    errorString.includes('fetch') ||
    errorString.includes('timeout') ||
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    error.code === 'NETWORK_ERROR' ||
    error.type === 'network';

  if (isNetworkError) {
    return {
      isNetworkError: true,
      message: 'No internet connection. Please check your network and try again.'
    };
  }

  if (error.code === 401 || error.code === 403) {
    return {
      isNetworkError: false,
      message: 'Authentication error. Please sign in again.'
    };
  }

  if (error.code === 404) {
    return {
      isNetworkError: false,
      message: 'Resource not found.'
    };
  }

  return {
    isNetworkError: false,
    message: error.message || 'An error occurred. Please try again.'
  };
};
