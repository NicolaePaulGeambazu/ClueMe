export const generateAnonymousId = (): string => {
  return `anon_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};
