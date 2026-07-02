
/**
 * Shared OTP Store for BDApps
 * In production, use Redis or a Database.
 */
export const otpStore = new Map<string, { referenceNo: string; timestamp: number; phone: string }>();

export const normalizePhone = (phone: string): string => {
  let clean = phone.replace(/\D/g, '');
  
  // 01XXXXXXXXX (11 digits) -> 8801XXXXXXXXX (13 digits)
  if (clean.length === 11 && clean.startsWith('0')) {
    clean = '88' + clean;
  } 
  // 1XXXXXXXXX (10 digits) -> 8801XXXXXXXXX (13 digits)
  else if (clean.length === 10 && clean.startsWith('1')) {
    clean = '880' + clean;
  }
  // 008801XXXXXXXXX -> 8801XXXXXXXXX
  else if (clean.startsWith('0088')) {
    clean = clean.substring(2);
  }
  
  return clean;
};
