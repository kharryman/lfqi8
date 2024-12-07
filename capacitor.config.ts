import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lfq.lfq',
  appName: 'Learn Facts Quick',
  webDir: 'www',
  server: {
    cleartext: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      androidClientId: '779902744578-ru9dk8rk12sksjm3uh9kb3344nh07559.apps.googleusercontent.com',
      serverClientId: '779902744578-ru9dk8rk12sksjm3uh9kb3344nh07559.apps.googleusercontent.com',
      clientId: '779902744578-pvr5rei9ja8ul09omp0a5def4l6b7d4b.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }  
};

export default config;
