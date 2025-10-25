import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>⚠️ Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.toString()}
          </Text>
          <Text style={styles.instruction}>
            Please restart the app
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#FF3B30',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 20,
  },
});

export default ErrorBoundary;
