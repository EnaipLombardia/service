import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: '01daff5e-c508-4862-bbfe-0d51c256f2e4', // Sostituisci
    authority: 'https://login.microsoftonline.com/a02141e8-1620-4b98-8b46-a99de7d2ba57', // Sostituisci
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
  }
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ['User.Read', 'User.ReadBasic.All', 'Directory.Read.All']
};

export const login = async () => {
  try {
    const response = await msalInstance.loginPopup(loginRequest);
    localStorage.setItem('graphAccessToken', response.accessToken);
    return response;
  } catch (error) {
    console.error('Errore login:', error);
    throw error;
  }
};
