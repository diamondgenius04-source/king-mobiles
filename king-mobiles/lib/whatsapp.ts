// Single source for the WhatsApp number. At runtime, prefer site_settings.whatsapp_number.
export const DEFAULT_WHATSAPP = "07069969046";

/** Nigerian local format (0706...) -> international digits (234706...) */
export function toInternational(raw: string, countryCode = "234"): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith(countryCode)) return digits;
  if (digits.startsWith("0")) return countryCode + digits.slice(1);
  return countryCode + digits;
}

export function waLink(message: string, number = DEFAULT_WHATSAPP): string {
  return `https://wa.me/${toInternational(number)}?text=${encodeURIComponent(message)}`;
}

export const productMessage = (name: string) =>
  `Hello King Mobiles, I am interested in ${name}. Please provide availability and price.`;
export const generalMessage = () => "Hello King Mobiles, I would like to make an inquiry.";
