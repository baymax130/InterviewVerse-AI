import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
}

export const interviewService = {
  start: (data) => api.post('/interview/start', data),
  submitAnswer: (sessionId, data) => api.post(`/interview/${sessionId}/submit`, data),
  getSession: (sessionId) => api.get(`/interview/${sessionId}`),
  getReport: (sessionId) => api.get(`/interview/${sessionId}/report`),
  getHistory: (params) => api.get('/interview/history', { params }),
  getPDFUrl: (sessionId) => `/api/interview/${sessionId}/report/pdf`,
}

export const dashboardService = {
  getDashboard: () => api.get('/dashboard/'),
  getAnalytics: (period) => api.get('/dashboard/analytics', { params: { period } }),
}

export const profileService = {
  getProfile: () => api.get('/profile/'),
  updateProfile: (data) => api.put('/profile/', data),
  changePassword: (data) => api.post('/profile/change-password', data),
  getLeaderboard: () => api.get('/profile/leaderboard'),
}

export const settingsService = {
  getSettings: () => api.get('/settings/'),
  updateSettings: (data) => api.put('/settings/', data),
}
