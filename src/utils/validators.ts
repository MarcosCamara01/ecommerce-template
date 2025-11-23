// Validation utilities

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+\d{1,3})?\s?(\d{1,4})[\s.-]?(\d{1,4})[\s.-]?(\d{1,4})[\s.-]?(\d{1,4})$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

export function isValidPostalCode(postalCode: string, country: string = "ES"): boolean {
  const patterns: { [key: string]: RegExp } = {
    ES: /^([0-4][0-9]|5[0-2])\d{3}$/,
    US: /^\d{5}(-\d{4})?$/,
    UK: /^[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}$/i,
  };
  
  const pattern = patterns[country];
  return pattern ? pattern.test(postalCode) : true;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0;
}

export function isValidPrice(price: number): boolean {
  return price >= 0 && !isNaN(price);
}

export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

