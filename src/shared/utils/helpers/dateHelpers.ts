// AUDITED 06/08/2025
export const dateHelpers = {
  getCurrentDate: () => new Date().toISOString().split('T')[0],
  getCurrentTimestamp: () => new Date().toISOString(),
};
