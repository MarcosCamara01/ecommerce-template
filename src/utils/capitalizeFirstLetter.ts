type CapitalizeFirstLetter = (s?: string) => string | undefined;

export const capitalizeFirstLetter: CapitalizeFirstLetter = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
