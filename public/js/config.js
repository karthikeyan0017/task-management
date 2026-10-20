export const CONFIG = {
  API_BASE: '/api',
  WS_URL: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
  APP_NAME: 'TaskFlow',
  DEFAULT_DEMO_USER: {
    email: 'demo@taskflow.dev',
    password: 'Demo123!'
  }
};
