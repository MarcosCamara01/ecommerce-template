// String and data formatters

const euroCurrencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(price: number): string {
  return formatPriceFromCents(price);
}

export function formatPriceFromCents(price: number): string {
  return euroCurrencyFormatter.format(price / 100);
}

export function formatPriceFromEuros(price: number): string {
  return euroCurrencyFormatter.format(price);
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

export function formatOrderNumber(orderNumber: number): string {
  return `#${String(orderNumber).padStart(6, "0")}`;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-");
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function capitalizeWords(str: string): string {
  return str
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}

