import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.golfstableford', // ⚠️ CHANGE 'yourname' to your actual name (e.g., 'com.johnsmith.golfstableford')
  appName: 'Golf Stableford',
  webDir: 'dist', // This should match your React build output
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#f8fdf8',
    allowsLinkPreview: false,
    scrollEnabled: true
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#f8fdf8'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f8fdf8',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#2d7d2d'
    }
  }
};

export default config;