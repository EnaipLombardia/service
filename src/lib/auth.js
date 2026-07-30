import { PublicClientApplication } from '@azure/msal-browser';

// 🔥 CONFIGURATO CON I TUOI DATI 🔥
const msalConfig = {
  auth: {
    clientId: '01daff5e-c508-4862-bbfe-0d51c256f2e4',
    authority: 'https://login.microsoftonline.com/a02141e8-1620-4b98-8b46-a99de7d2ba57',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
  }
};

// Crea l'istanza
export const msalInstance = new PublicClientApplication(msalConfig);

// Inizializza MSAL
export const initializeMsal = async () => {
  try {
    await msalInstance.initialize();
    console.log('✅ MSAL inizializzato');
  } catch (error) {
    console.error('❌ Errore inizializzazione MSAL:', error);
    throw error;
  }
};

// Richiesta di login
export const loginRequest = {
  scopes: ['User.Read', 'User.ReadBasic.All', 'Directory.Read.All']
};

// Funzione di login
export const login = async () => {
  try {
    await initializeMsal();
    const response = await msalInstance.loginPopup(loginRequest);
    localStorage.setItem('graphAccessToken', response.accessToken);
    localStorage.setItem('userInfo', JSON.stringify(response.account));
    return response;
  } catch (error) {
    console.error('❌ Errore login:', error);
    throw error;
  }
};

// Funzione di logout
export const logout = () => {
  localStorage.removeItem('graphAccessToken');
  localStorage.removeItem('userInfo');
  msalInstance.logoutPopup();
};

// Verifica se l'utente è loggato
export const isLoggedIn = () => {
  return !!localStorage.getItem('graphAccessToken');
};

// Ottieni le informazioni dell'utente loggato
export const getUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};
