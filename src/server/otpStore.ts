
/**
 * Shared OTP Store for BDApps
 * In production, use Redis or a Database.
 */
export const otpStore = new Map<string, { referenceNo: string; timestamp: number; phone: string }>();

export const normalizePhone = (phone: string): string => {
  let clean = phone.replace(/\D/g, '');
  
  if (clean.startsWith('0')) {
    clean = '88' + clean;
  } else if (clean.startsWith('1') && clean.length === 10) {
    clean = '880' + clean;
  }
  
  if (clean.startsWith('8888')) {
    clean = clean.substring(2);
  }
  
  return clean;
};
