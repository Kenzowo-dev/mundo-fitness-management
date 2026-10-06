export const gym = {
  name: "Mundo Fitness",
  slogan: "vive diferente",
  city: "Trujillo",
  locationName: "Mundo Fitness Palermo",
  address: "Av. César Vallejo 690, Trujillo 13006",
  mapsUrl: "https://maps.app.goo.gl/StUWA2QRRnUzpuGN6",
  // Use a real international number, digits only, to enable WhatsApp.
  whatsappNumber: "",
  whatsappMessage: "Hola, quiero conocer los planes de Mundo Fitness.",
  schedule: [
    { days: "Lunes a viernes", hours: "6:00 a. m. – 10:00 p. m." },
    { days: "Sábados", hours: "7:00 a. m. – 6:00 p. m." },
  ],
  scheduleIsExample: true,
  hero: {
    src: "/assets/gym-membership-hero.jpg",
    alt: "Zona de entrenamiento con pesas y máquinas",
    isReference: true,
  },
};

export function whatsappUrl() {
  const number = gym.whatsappNumber.trim();
  return /^[1-9]\d{7,14}$/.test(number)
    ? `https://wa.me/${number}?text=${encodeURIComponent(gym.whatsappMessage)}`
    : null;
}
