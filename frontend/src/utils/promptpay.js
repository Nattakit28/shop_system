export const formatPromptPayNumber = (number) => {
  if (!number) return '';
  
  // Remove all non-digits
  const cleaned = number.replace(/\D/g, '');
  
  // Format phone number (0X-XXXX-XXXX)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  // Format ID card (X-XXXX-XXXXX-XX-X)
  if (cleaned.length === 13) {
    return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned.slice(12)}`;
  }
  
  return number;
};

export const validatePromptPayNumber = (number) => {
  const cleaned = number.replace(/\D/g, '');
  
  // Check if it's a valid phone number (10 digits starting with 0)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return true;
  }
  
  // Check if it's a valid ID card number (13 digits)
  if (cleaned.length === 13) {
    return true;
  }
  
  return false;
};

export const formatCurrency = (amount) => {
  try {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      console.warn('Invalid amount for currency formatting:', amount);
      return '฿0';
    }
    
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numAmount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '฿0';
  }
};

export const formatDate = (date) => {
  try {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'วันที่ไม่ถูกต้อง';
  }
};