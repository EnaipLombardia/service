import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: 'TUO_CLIENT_ID', // Da Azure Portal
    authority: 'https://login.microsoftonline.com/TUO_TENANT_ID',
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
