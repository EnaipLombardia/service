// ⚠️ PER ORA È UNO SCHELETRO
// Dovrai configurare con le tue credenziali Azure AD
export const login = async () => {
  // Per ora, un alert per test
  alert('🔐 Funzionalità di login Microsoft in sviluppo.\nPer ora puoi inserire manualmente il nome del dipendente.');
};

export const logout = () => {
  localStorage.removeItem('graphAccessToken');
};
