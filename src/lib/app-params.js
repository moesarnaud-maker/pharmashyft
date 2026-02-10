const urlParams = new URLSearchParams(window.location.search);

// Get token from URL or localStorage
let token = urlParams.get('access_token');
if (token) {
  localStorage.setItem('access_token', token);
  // Remove token from URL
  const url = new URL(window.location.href);
  url.searchParams.delete('access_token');
  window.history.replaceState({}, '', url.toString());
} else {
  token = localStorage.getItem('access_token');
}

export const appParams = {
  appId: import.meta.env.VITE_BASE44_APP_ID || urlParams.get('app_id') || '',
  token: token,
  functionsVersion: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION || 'prod',
  appBaseUrl: import.meta.env.VITE_BASE44_APP_BASE_URL || '',
};
