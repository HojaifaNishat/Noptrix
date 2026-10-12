import { PASSWORD_RESET_EMAIL_STORAGE_KEY } from "@/constants/auth";

const PASSWORD_RESET_EMAIL_EVENT = "noptrix:password-reset-email-change";

export const subscribeToPasswordResetEmail = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(PASSWORD_RESET_EMAIL_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PASSWORD_RESET_EMAIL_EVENT, callback);
  };
};

export const getPasswordResetEmail = () =>
  sessionStorage.getItem(PASSWORD_RESET_EMAIL_STORAGE_KEY);

export const savePasswordResetEmail = (email: string) => {
  sessionStorage.setItem(PASSWORD_RESET_EMAIL_STORAGE_KEY, email);
  window.dispatchEvent(new Event(PASSWORD_RESET_EMAIL_EVENT));
};

export const clearPasswordResetEmail = () => {
  sessionStorage.removeItem(PASSWORD_RESET_EMAIL_STORAGE_KEY);
  window.dispatchEvent(new Event(PASSWORD_RESET_EMAIL_EVENT));
};
