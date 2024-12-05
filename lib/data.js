export const IMG = (id, w) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w || 900}&q=70`;

export const SERVICE_META = {
  wifi: { ic: "wifi", es: "WiFi gratis", en: "Free WiFi", pt: "WiFi grátis" },
  breakfast: { ic: "coffee", es: "Desayuno", en: "Breakfast", pt: "Café da manhã" },
  ac: { ic: "snow", es: "Aire acondicionado", en: "Air conditioning", pt: "Ar-condicionado" },
  pool: { ic: "waves", es: "Piscina", en: "Pool", pt: "Piscina" },
  spa: { ic: "sparkles", es: "Spa", en: "Spa", pt: "Spa" },
  parking: { ic: "parking", es: "Estacionamiento", en: "Parking", pt: "Estacionamento" },
  jacuzzi: { ic: "bath", es: "Jacuzzi", en: "Jacuzzi", pt: "Jacuzzi" },
  view: { ic: "sun", es: "Vista al mar", en: "Sea view", pt: "Vista para o mar" },
  restaurant: { ic: "utensils", es: "Restaurante", en: "Restaurant", pt: "Restaurante" },
  minibar: { ic: "wine", es: "Minibar", en: "Minibar", pt: "Frigobar" },
};

export const FILTER_SERVICES = ["wifi", "breakfast", "ac", "pool", "spa", "parking", "jacuzzi", "view"];

export const ROOMS = [
  {
    id: 1, type: "suite", cat: "t_suite", stars: 5, price: 320, cap: 2,
    bed: { es: "1 cama King", en: "1 King bed", pt: "1 cama King" },
    rating: 9.4, ratingCount: 214, eco: false,
    services: ["wifi", "breakfast", "ac", "spa", "view", "pool", "minibar"],
    name: { es: "Suite Deluxe", en: "Deluxe Suite", pt: "Suíte Deluxe" },
    short: {
      es: "Amplia suite con balcón privado y vista parcial al mar.",
      en: "Spacious suite with private balcony and partial sea view.",
      pt: "Suíte ampla com varanda privativa e vista parcial para o mar.",
    },
    long: {
      es: "Nuestra Suite Deluxe combina elegancia y confort en 45 m². Disfrutá de un balcón privado, cama King premium, zona de estar independiente y amenities de lujo. Ideal para una escapada romántica o de descanso frente al Caribe.",
      en: "Our Deluxe Suite blends elegance and comfort across 45 m². Enjoy a private balcony, premium King bed, separate living area and luxury amenities. Perfect for a romantic or restful Caribbean getaway.",
      pt: "Nossa Suíte Deluxe une elegância e conforto em 45 m². Aproveite a varanda privativa, cama King premium, sala de estar separada e amenidades de luxo. Ideal para uma escapada romântica no Caribe.",
    },
    images: ["1590490360182-c33d57733427", "1611892440504-42a792e24d32", "1582719478250-c89cae4dc85b", "1540555700478-4be289fbecef"],
  },
  {
    id: 2, type: "double", cat: "t_double", stars: 4, price: 180, cap: 2,
    bed: { es: "1 cama Queen", en: "1 Queen bed", pt: "1 cama Queen" },
    rating: 8.6, ratingCount: 147, eco: true,
    services: ["wifi", "breakfast", "ac", "pool", "parking"],
    name: { es: "Habitación Doble Superior", en: "Superior Double Room", pt: "Quarto Duplo Superior" },
    short: {
      es: "Cómoda habitación doble con todas las comodidades esenciales.",
      en: "Comfortable double room with all essential amenities.",
      pt: "Quarto duplo confortável com todas as comodidades essenciais.",
    },
    long: {
      es: "La Doble Superior ofrece 28 m² de confort con cama Queen, escritorio de trabajo y baño moderno. Perfecta para parejas o viajeros de negocios que buscan calidad a buen precio.",
      en: "The Superior Double offers 28 m² of comfort with a Queen bed, work desk and modern bathroom. Perfect for couples or business travelers seeking quality at a fair price.",
      pt: "O Duplo Superior oferece 28 m² de conforto com cama Queen, mesa de trabalho e banheiro moderno. Perfeito para casais ou viajantes a negócios.",
    },
    images: ["1566665797739-1674de7a421a", "1631049307264-da0ec9d70304", "1505693416388-ac5ce068fe85", "1414235077428-338989a2e8c0"],
  },
  {
    id: 3, type: "family", cat: "t_family", stars: 5, price: 420, cap: 5,
    bed: { es: "1 King + 2 individuales", en: "1 King + 2 singles", pt: "1 King + 2 solteiro" },
    rating: 9.1, ratingCount: 188, eco: true,
    services: ["wifi", "breakfast", "ac", "pool", "jacuzzi", "view", "restaurant"],
    name: { es: "Suite Familiar", en: "Family Suite", pt: "Suíte Família" },
    short: {
      es: "Espaciosa suite de dos ambientes ideal para toda la familia.",
      en: "Spacious two-room suite ideal for the whole family.",
      pt: "Suíte espaçosa de dois ambientes ideal para toda a família.",
    },
    long: {
      es: "Con 65 m² y dos ambientes separados, la Suite Familiar aloja cómodamente hasta 5 personas. Incluye jacuzzi, zona de juegos para niños y vista al mar. El plan perfecto para vacaciones en familia.",
      en: "At 65 m² with two separate areas, the Family Suite comfortably hosts up to 5 people. Includes jacuzzi, kids play area and sea view. The perfect family vacation plan.",
      pt: "Com 65 m² e dois ambientes, a Suíte Família acomoda até 5 pessoas. Inclui jacuzzi, área de jogos para crianças e vista para o mar.",
    },
    images: ["1560448204-e02f11c3d0e2", "1522708323590-d24dbb6b0267", "1571003123894-1f0594d2b5d9", "1540541338287-41700207dee6"],
  },
  {
    id: 4, type: "single", cat: "t_single", stars: 4, price: 130, cap: 1,
    bed: { es: "1 cama individual", en: "1 single bed", pt: "1 cama de solteiro" },
    rating: 8.2, ratingCount: 96, eco: false,
    services: ["wifi", "breakfast", "ac", "parking"],
    name: { es: "Habitación Individual Ejecutiva", en: "Executive Single Room", pt: "Quarto Individual Executivo" },
    short: {
      es: "Habitación funcional pensada para el viajero de negocios.",
      en: "Functional room designed for the business traveler.",
      pt: "Quarto funcional pensado para o viajante de negócios.",
    },
    long: {
      es: "La Individual Ejecutiva (20 m²) está diseñada para máxima productividad: escritorio ergonómico, WiFi de alta velocidad y área de descanso. Ideal para estadías cortas de trabajo.",
      en: "The Executive Single (20 m²) is designed for maximum productivity: ergonomic desk, high-speed WiFi and rest area. Ideal for short work stays.",
      pt: "O Individual Executivo (20 m²) é feito para máxima produtividade: mesa ergonômica, WiFi de alta velocidade e área de descanso.",
    },
    images: ["1631049035182-249067d7618e", "1587985064135-0366536eab42", "1505693416388-ac5ce068fe85", "1445019980597-93fa8acb246c"],
  },
  {
    id: 5, type: "suite", cat: "t_suite", stars: 5, price: 380, cap: 3,
    bed: { es: "1 cama King", en: "1 King bed", pt: "1 cama King" },
    rating: 9.7, ratingCount: 241, eco: true,
    services: ["wifi", "breakfast", "ac", "spa", "view", "jacuzzi", "pool", "restaurant"],
    name: { es: "Suite con Vista al Lago", en: "Lake View Suite", pt: "Suíte Vista para o Lago" },
    short: {
      es: "Nuestra joya: suite premium con vistas panorámicas al agua.",
      en: "Our gem: premium suite with panoramic water views.",
      pt: "Nossa joia: suíte premium com vista panorâmica para a água.",
    },
    long: {
      es: "La Suite con Vista al Lago es nuestra habitación insignia. 55 m² con ventanales panorámicos, jacuzzi privado en la terraza y acceso preferencial al spa. Una experiencia de lujo inolvidable frente al agua.",
      en: "The Lake View Suite is our flagship room. 55 m² with panoramic windows, private terrace jacuzzi and preferred spa access. An unforgettable luxury experience by the water.",
      pt: "A Suíte Vista para o Lago é nosso quarto principal. 55 m² com janelas panorâmicas, jacuzzi privativo no terraço e acesso preferencial ao spa.",
    },
    images: ["1571003123894-1f0594d2b5d9", "1540541338287-41700207dee6", "1582719478250-c89cae4dc85b", "1618773928121-c32242e63f39"],
  },
  {
    id: 6, type: "premium", cat: "t_premium", stars: 5, price: 260, cap: 2,
    bed: { es: "1 cama King", en: "1 King bed", pt: "1 cama King" },
    rating: 9.0, ratingCount: 173, eco: false,
    services: ["wifi", "breakfast", "ac", "view", "minibar", "pool"],
    name: { es: "Habitación Premium King", en: "Premium King Room", pt: "Quarto Premium King" },
    short: {
      es: "Elegancia moderna con cama King y vista al jardín tropical.",
      en: "Modern elegance with King bed and tropical garden view.",
      pt: "Elegância moderna com cama King e vista para o jardim tropical.",
    },
    long: {
      es: "La Premium King (35 m²) ofrece un diseño contemporáneo con cama King, minibar surtido y ventanales al jardín tropical. El equilibrio perfecto entre estilo, confort y precio.",
      en: "The Premium King (35 m²) offers contemporary design with a King bed, stocked minibar and windows to the tropical garden. The perfect balance of style, comfort and price.",
      pt: "O Premium King (35 m²) oferece design contemporâneo com cama King, frigobar abastecido e janelas para o jardim tropical.",
    },
    images: ["1618773928121-c32242e63f39", "1615874959474-d609969a20ed", "1584132967334-10e028bd69f7", "1590490360182-c33d57733427"],
  },
];

export const INITIAL_RESERVATIONS = [
  { code: "HF-8K2P4", guest: "Laura Gómez", roomId: 1, checkIn: "2026-07-10", checkOut: "2026-07-14", status: "confirmed" },
  { code: "HF-3F9L7", guest: "Carlos Ruiz", roomId: 3, checkIn: "2026-07-12", checkOut: "2026-07-16", status: "pending" },
  { code: "HF-Q1W5E", guest: "Ana Martins", roomId: 5, checkIn: "2026-07-18", checkOut: "2026-07-21", status: "confirmed" },
  { code: "HF-7T4Y2", guest: "John Smith", roomId: 2, checkIn: "2026-07-05", checkOut: "2026-07-08", status: "cancelled" },
  { code: "HF-9P0O3", guest: "María Fernández", roomId: 6, checkIn: "2026-07-22", checkOut: "2026-07-25", status: "pending" },
  { code: "HF-5D6S8", guest: "Pedro Alves", roomId: 4, checkIn: "2026-07-15", checkOut: "2026-07-17", status: "confirmed" },
];
