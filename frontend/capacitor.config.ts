import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sbi.yono.safeguard',
  appName: 'SBI YONO SafeGuard',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    url: 'https://sbi-yono-fraud-protection.netlify.app'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0066b3'
    }
  }
};

export default config;
