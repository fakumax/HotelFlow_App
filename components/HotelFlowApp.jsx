"use client";

import { useState } from "react";
import Icon from "./Icon";
import { I18N } from "@/lib/i18n";
import { ROOMS, INITIAL_RESERVATIONS, SERVICE_META, FILTER_SERVICES, IMG } from "@/lib/data";

function todayPlus(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "HF-" + s;
}

function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

const ROOM_RULES = {
  es: ["Check-in a partir de las 15:00 · Check-out hasta las 12:00", "No se permite fumar dentro de la habitación", "Mascotas permitidas bajo solicitud previa"],
  en: ["Check-in from 3:00 PM · Check-out until 12:00 PM", "No smoking inside the room", "Pets allowed upon prior request"],
  pt: ["Check-in a partir das 15:00 · Check-out até as 12:00", "Não é permitido fumar no quarto", "Animais permitidos mediante solicitação prévia"],
};

const HERO_IMG = IMG("1507525428034-b723cf961d3e", 1600);

export default function HotelFlowApp() {
  const [lang, setLang] = useState("es");
  const [screen, setScreen] = useState("home");
  const [loading, setLoading] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [search, setSearch] = useState({
    destination: "Playa del Carmen",
    checkIn: todayPlus(14),
    checkOut: todayPlus(17),
    adults: 2,
    children: 0,
  });
  const [filters, setFilters] = useState({ maxPrice: 500, minRating: 0, type: "all", services: [], stars: 0 });
  const [sort, setSort] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [detailTab, setDetailTab] = useState("desc");
  const [booking, setBooking] = useState({
    fullName: "", email: "", phone: "", document: "", comments: "",
    payment: "hotel", card: { number: "", name: "", exp: "", cvv: "" }, terms: false,
  });
  const [touched, setTouched] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [reservations, setReservations] = useState(INITIAL_RESERVATIONS);
  const [adminTab, setAdminTab] = useState("reservations");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);

  const L = I18N[lang];
  const searchTimer = { current: null };

  // ---------- derived helpers ----------
  const getRoom = (id) => ROOMS.find((r) => r.id === id);
  const guestsCount = () => search.adults + search.children;
  const guestsWord = lang === "en" ? "guests" : lang === "pt" ? "hóspedes" : "huéspedes";
  const guestsLabel = `${search.adults} ${L.guestsWord_adult}, ${search.children} ${L.guestsWord_child}`;

  const fmtDate = (s) => {
    if (!s) return "–";
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  };

  const nights = (() => {
    const a = new Date(search.checkIn);
    const b = new Date(search.checkOut);
    const n = Math.round((b - a) / 86400000);
    return n > 0 ? n : 1;
  })();

  const ratingLabelFor = (r) => {
    if (r >= 9) return L.r_wonderful.split("· ")[1] || "Excelente";
    if (r >= 8) return L.r_verygood.split("· ")[1];
    if (r >= 7) return L.r_good.split("· ")[1];
    return L.r_pleasant.split("· ")[1];
  };

  const priceStr = (p) => "$" + p;

  const cardInfo = (r) => ({
    id: r.id,
    name: r.name[lang],
    short: r.short[lang],
    stars: "★".repeat(r.stars),
    cover: IMG(r.images[0]),
    rating: r.rating.toFixed(1),
    ratingLabel: ratingLabelFor(r.rating),
    ratingCount: r.ratingCount,
    priceLabel: priceStr(r.price),
    guestsLine: `${r.cap} ${guestsWord}`,
    eco: r.eco,
    chips: r.services.slice(0, 4).map((s) => SERVICE_META[s][lang]),
  });

  const computeFiltered = () => {
    const g = guestsCount();
    let list = ROOMS.filter((r) => {
      if (r.price > filters.maxPrice) return false;
      if (filters.minRating && r.rating < filters.minRating) return false;
      if (filters.type !== "all" && r.cat !== "t_" + filters.type) return false;
      if (filters.stars && r.stars < filters.stars) return false;
      if (filters.services.length && !filters.services.every((s) => r.services.includes(s))) return false;
      if (r.cap < g) return false;
      return true;
    });
    if (sort === "priceLow") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "priceHigh") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  };

  const filteredRooms = computeFiltered();
  const selectedRoom = getRoom(selectedRoomId);
  const activeRoom = selectedRoom || getRoom(1);
  const subtotal = activeRoom ? activeRoom.price * nights : 0;
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + taxes;

  // ---------- navigation ----------
  const goHome = () => { setScreen("home"); setGuestsOpen(false); window.scrollTo(0, 0); };
  const goRooms = () => { setScreen("results"); setGuestsOpen(false); window.scrollTo(0, 0); };
  const goAdmin = () => { setScreen("admin"); setGuestsOpen(false); window.scrollTo(0, 0); };
  const runSearch = () => {
    setScreen("results"); setLoading(true); setGuestsOpen(false); window.scrollTo(0, 0);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => setLoading(false), 700);
  };
  const selectRoom = (id) => {
    setSelectedRoomId(id); setScreen("detail"); setGalleryIndex(0); setDetailTab("desc"); setGuestsOpen(false);
    window.scrollTo(0, 0);
  };
  const bookRoom = (id) => {
    setSelectedRoomId(id); setScreen("booking"); setTouched(false); setGuestsOpen(false);
    window.scrollTo(0, 0);
  };
  const goBooking = () => { setScreen("booking"); setTouched(false); setGuestsOpen(false); window.scrollTo(0, 0); };
  const backToDetail = () => { setScreen("detail"); window.scrollTo(0, 0); };

  // ---------- search bar ----------
  const onDest = (e) => setSearch((s) => ({ ...s, destination: e.target.value }));
  const onCheckIn = (e) => setSearch((s) => ({ ...s, checkIn: e.target.value }));
  const onCheckOut = (e) => setSearch((s) => ({ ...s, checkOut: e.target.value }));
  const toggleGuests = () => setGuestsOpen((o) => !o);
  const closeGuests = () => setGuestsOpen(false);
  const incAdults = () => setSearch((s) => ({ ...s, adults: Math.min(6, s.adults + 1) }));
  const decAdults = () => setSearch((s) => ({ ...s, adults: Math.max(1, s.adults - 1) }));
  const incChildren = () => setSearch((s) => ({ ...s, children: Math.min(4, s.children + 1) }));
  const decChildren = () => setSearch((s) => ({ ...s, children: Math.max(0, s.children - 1) }));

  // ---------- filters ----------
  const onMaxPrice = (e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }));
  const setRating = (v) => setFilters((f) => ({ ...f, minRating: v }));
  const setType = (v) => setFilters((f) => ({ ...f, type: v }));
  const setStars = (v) => setFilters((f) => ({ ...f, stars: f.stars === v ? 0 : v }));
  const toggleService = (k) =>
    setFilters((f) => ({ ...f, services: f.services.includes(k) ? f.services.filter((x) => x !== k) : [...f.services, k] }));
  const clearFilters = () => setFilters({ maxPrice: 500, minRating: 0, type: "all", services: [], stars: 0 });
  const onSort = (e) => setSort(e.target.value);

  // ---------- detail ----------
  const setGallery = (i) => setGalleryIndex(i);

  // ---------- booking form ----------
  const onName = (e) => setBooking((b) => ({ ...b, fullName: e.target.value }));
  const onEmail = (e) => setBooking((b) => ({ ...b, email: e.target.value }));
  const onPhone = (e) => setBooking((b) => ({ ...b, phone: e.target.value }));
  const onDocument = (e) => setBooking((b) => ({ ...b, document: e.target.value }));
  const onComments = (e) => setBooking((b) => ({ ...b, comments: e.target.value }));
  const onCardNumber = (e) => setBooking((b) => ({ ...b, card: { ...b.card, number: e.target.value } }));
  const onCardExp = (e) => setBooking((b) => ({ ...b, card: { ...b.card, exp: e.target.value } }));
  const onCardCvv = (e) => setBooking((b) => ({ ...b, card: { ...b.card, cvv: e.target.value } }));
  const payHotel = () => setBooking((b) => ({ ...b, payment: "hotel" }));
  const payCard = () => setBooking((b) => ({ ...b, payment: "card" }));
  const toggleTerms = () => setBooking((b) => ({ ...b, terms: !b.terms }));

  const confirmBooking = () => {
    setTouched(true);
    const ok = booking.fullName.trim() && validEmail(booking.email) && booking.phone.trim() && booking.terms;
    if (!ok) return;
    const room = activeRoom;
    const code = genCode();
    const bookedTotal = Math.round(room.price * nights * 1.12);
    const res = {
      code, guest: booking.fullName, roomId: room.id,
      checkIn: search.checkIn, checkOut: search.checkOut, status: "confirmed", _total: bookedTotal,
    };
    setReservations((list) => [res, ...list]);
    setConfirmation({ code, guest: booking.fullName, total: bookedTotal, payment: booking.payment });
    setScreen("confirmation");
    window.scrollTo(0, 0);
  };

  // ---------- admin ----------
  const setAdminReservations = () => setAdminTab("reservations");
  const setAdminRooms = () => setAdminTab("rooms");
  const askConfirm = (code) =>
    setModal({ kind: "confirm", iconName: "checkCircle", iconColor: "#16a34a", title: L.m_confirmTitle, body: L.m_confirmBody, confirmLabel: L.m_confirmYes, confirmBg: "#16a34a", hasCancel: true, code });
  const askCancel = (code) =>
    setModal({ kind: "cancel", iconName: "alert", iconColor: "#f59e0b", title: L.m_cancelTitle, body: L.m_cancelBody, confirmLabel: L.m_cancelYes, confirmBg: "#dc2626", hasCancel: true, code });
  const showDetailModal = (r) => {
    const room = getRoom(r.roomId);
    setModal({
      kind: "detail", iconName: "clipboard", iconColor: "#2563eb", title: L.m_detailTitle, body: "",
      confirmLabel: L.m_ok, confirmBg: "#2563eb", hasCancel: false, hasDetails: true,
      details: [
        { k: L.thCode, v: r.code }, { k: L.confGuest, v: r.guest }, { k: L.thRoom, v: room.name[lang] },
        { k: L.checkIn, v: fmtDate(r.checkIn) }, { k: L.checkOut, v: fmtDate(r.checkOut) },
      ],
    });
  };
  const editRoom = () =>
    setModal({ kind: "edit", iconName: "wrench", iconColor: "#2563eb", title: L.m_editTitle, body: L.m_editBody, confirmLabel: L.m_ok, confirmBg: "#2563eb", hasCancel: false });
  const closeModal = () => setModal(null);
  const resolveModal = () => {
    if (!modal) return;
    if (modal.kind === "confirm") {
      setReservations((list) => list.map((r) => (r.code === modal.code ? { ...r, status: "confirmed" } : r)));
      setModal(null);
    } else if (modal.kind === "cancel") {
      setReservations((list) => list.map((r) => (r.code === modal.code ? { ...r, status: "cancelled" } : r)));
      setModal(null);
    } else {
      setModal(null);
    }
  };

  const imgErr = (e) => { e.target.style.opacity = 0; };
  const stopProp = (e) => e.stopPropagation();

  // ---------- shared style bits ----------
  const decAdultsColor = search.adults <= 1 ? "#cbd5e6" : "#2563eb";
  const decChildrenColor = search.children <= 0 ? "#cbd5e6" : "#2563eb";
  const guestsBorder = guestsOpen ? "#2563eb" : "#d8e0ee";

  function GuestsDropdown({ align = "left" }) {
    if (!guestsOpen) return null;
    return (
      <div style={{ position: "absolute", top: "calc(100% + 8px)", [align]: 0, minWidth: 270, zIndex: 30, background: "#fff", border: "1px solid #e3e9f4", borderRadius: 14, boxShadow: "0 16px 40px rgba(16,24,40,.16)", padding: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 10px" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: "#0f172a" }}>{L.adults}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{L.adultsHint}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span onClick={decAdults} className="hf-step" style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${decAdultsColor}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: decAdultsColor }}>
              <Icon name="minus" size={15} strokeWidth={2.5} />
            </span>
            <span style={{ minWidth: 16, textAlign: "center", fontWeight: 700, fontSize: 15 }}>{search.adults}</span>
            <span onClick={incAdults} className="hf-step" style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#2563eb" }}>
              <Icon name="plus" size={15} strokeWidth={2.5} />
            </span>
          </div>
        </div>
        <div style={{ height: 1, background: "#eef2f8", margin: "0 8px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 10px" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: "#0f172a" }}>{L.children}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{L.childrenHint}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span onClick={decChildren} className="hf-step" style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${decChildrenColor}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: decChildrenColor }}>
              <Icon name="minus" size={15} strokeWidth={2.5} />
            </span>
            <span style={{ minWidth: 16, textAlign: "center", fontWeight: 700, fontSize: 15 }}>{search.children}</span>
            <span onClick={incChildren} className="hf-step" style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#2563eb" }}>
              <Icon name="plus" size={15} strokeWidth={2.5} />
            </span>
          </div>
        </div>
        <button onClick={closeGuests} className="hf-btn" style={{ width: "100%", background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: 11, fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 6 }}>
          {L.apply}
        </button>
      </div>
    );
  }

  // ==================== NAVBAR ====================
  function renderNavbar() {
    const langs = ["es", "en", "pt"];
    return (
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(255,255,255,.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid #e8edf5" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div onClick={goHome} style={{ display: "flex", flexDirection: "column", cursor: "pointer", userSelect: "none", lineHeight: 1 }}>
            <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: -1.2, color: "#0f172a" }}>
              hotel<span style={{ color: "#2563eb" }}>flow</span><span style={{ color: "#2563eb" }}>.</span>
            </span>
            <span style={{ fontSize: 8.5, letterSpacing: 3.5, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginTop: 2 }}>Beach Resort</span>
          </div>

          <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span onClick={goHome} className="hf-navlink" style={{ cursor: "pointer", fontWeight: 600, fontSize: 14.5, color: screen === "home" ? "#2563eb" : "#334155", padding: "8px 12px" }}>{L.navHome}</span>
            <span onClick={goRooms} className="hf-navlink" style={{ cursor: "pointer", fontWeight: 600, fontSize: 14.5, color: screen === "results" || screen === "detail" ? "#2563eb" : "#334155", padding: "8px 12px" }}>{L.navRooms}</span>
            <span onClick={goAdmin} className="hf-navlink" style={{ cursor: "pointer", fontWeight: 600, fontSize: 14.5, color: screen === "admin" ? "#2563eb" : "#334155", padding: "8px 12px" }}>{L.navAdmin}</span>

            <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#f0f4fb", border: "1px solid #e3e9f4", borderRadius: 9, padding: 3, marginLeft: 8 }}>
              {langs.map((code) => (
                <span key={code} onClick={() => setLang(code)} style={{ cursor: "pointer", fontSize: 12, fontWeight: 700, padding: "5px 9px", borderRadius: 6, background: lang === code ? "#2563eb" : "transparent", color: lang === code ? "#fff" : "#64748b" }}>
                  {code.toUpperCase()}
                </span>
              ))}
            </div>

            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eaf1ff", border: "1px solid #dbe6f8", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", fontWeight: 700, fontSize: 14, marginLeft: 6 }}>JM</div>
          </nav>
        </div>
      </header>
    );
  }

  // ==================== HOME ====================
  function renderHome() {
    const benefits = [
      { icon: "refresh", title: L.b_cancel, desc: L.b_cancelD },
      { icon: "coffee", title: L.b_breakfast, desc: L.b_breakfastD },
      { icon: "headset", title: L.b_support, desc: L.b_supportD },
      { icon: "tag", title: L.b_price, desc: L.b_priceD },
    ];
    const featuredRooms = [getRoom(5), getRoom(1), getRoom(3)].map(cardInfo);
    const testimonials = [
      {
        stars: "★★★★★", initials: "LG", name: "Laura Gómez", location: "Ciudad de México",
        text: lang === "es" ? "Una experiencia increíble. La suite con vista al mar superó todas nuestras expectativas." : lang === "pt" ? "Uma experiência incrível. A suíte com vista para o mar superou todas as expectativas." : "An incredible experience. The sea-view suite exceeded all our expectations.",
      },
      {
        stars: "★★★★★", initials: "JS", name: "John Smith", location: "Austin, USA",
        text: lang === "es" ? "Atención impecable y desayuno espectacular. Volveremos sin dudarlo." : lang === "pt" ? "Atendimento impecável e café da manhã espetacular. Voltaremos com certeza." : "Impeccable service and a spectacular breakfast. We’ll be back for sure.",
      },
      {
        stars: "★★★★★", initials: "AM", name: "Ana Martins", location: "São Paulo, BR",
        text: lang === "es" ? "El lugar perfecto para desconectar. Limpieza, tranquilidad y una vista de ensueño." : lang === "pt" ? "O lugar perfeito para relaxar. Limpeza, tranquilidade e uma vista dos sonhos." : "The perfect place to disconnect. Cleanliness, calm and a dreamy view.",
      },
    ];

    return (
      <div className="hf-fade">
        {/* HERO */}
        <section style={{ position: "relative", minHeight: 560, display: "flex", alignItems: "center", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg,#0b2a6b,#1e5fd8)" }}>
            <img src={HERO_IMG} onError={imgErr} alt="resort" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
          </div>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(6,18,48,.35),rgba(6,18,48,.65))" }} />
          <div style={{ position: "relative", maxWidth: 1240, margin: "0 auto", padding: "70px 24px 150px", width: "100%" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
              <Icon name="star" color="#fbbf24" size={15} /><span>4.9 · {L.heroBadge}</span>
            </div>
            <h1 style={{ color: "#fff", fontSize: 56, lineHeight: 1.05, fontWeight: 800, letterSpacing: -1.5, margin: "0 0 16px", maxWidth: 720, textWrap: "balance" }}>{L.heroTitle}</h1>
            <p style={{ color: "rgba(255,255,255,.9)", fontSize: 19, lineHeight: 1.5, margin: 0, maxWidth: 540 }}>{L.heroSubtitle}</p>
          </div>
        </section>

        {/* SEARCH BAR */}
        <section style={{ maxWidth: 1160, margin: "-90px auto 0", padding: "0 24px", position: "relative", zIndex: 5 }}>
          <div style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 20, boxShadow: "0 20px 50px rgba(16,24,40,.14)", padding: 22 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "#0f172a" }}>{L.searchTitle}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1.2fr auto", gap: 12, alignItems: "end" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>{L.destination}</label>
                <input value={search.destination} onChange={onDest} style={{ width: "100%", border: "1px solid #d8e0ee", borderRadius: 11, padding: "13px 14px", fontSize: 15, fontWeight: 600, color: "#0f172a" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>{L.checkIn}</label>
                <input type="date" value={search.checkIn} onChange={onCheckIn} style={{ width: "100%", border: "1px solid #d8e0ee", borderRadius: 11, padding: "12px 14px", fontSize: 14.5, fontWeight: 600, color: "#0f172a" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>{L.checkOut}</label>
                <input type="date" value={search.checkOut} onChange={onCheckOut} style={{ width: "100%", border: "1px solid #d8e0ee", borderRadius: 11, padding: "12px 14px", fontSize: 14.5, fontWeight: 600, color: "#0f172a" }} />
              </div>
              <div style={{ position: "relative" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>{L.guests}</label>
                <div onClick={toggleGuests} style={{ width: "100%", border: `1px solid ${guestsBorder}`, borderRadius: 11, padding: "13px 14px", fontSize: 14.5, fontWeight: 600, color: "#0f172a", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{guestsLabel}</span>
                  <Icon name="chevronDown" color="#94a3b8" size={16} />
                </div>
                <GuestsDropdown />
              </div>
              <button onClick={runSearch} className="hf-btn" style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 11, padding: "14px 26px", fontWeight: 700, fontSize: 15, cursor: "pointer", height: 49 }}>{L.searchBtn}</button>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section style={{ maxWidth: 1160, margin: "64px auto 0", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
            {benefits.map((b, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 16, padding: "24px 20px", textAlign: "left" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eaf1ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon name={b.icon} color="#2563eb" size={22} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: "#0f172a" }}>{b.title}</div>
                <div style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.5 }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURED ROOMS */}
        <section style={{ maxWidth: 1160, margin: "72px auto 0", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, margin: "0 0 6px" }}>{L.featuredTitle}</h2>
              <p style={{ color: "#64748b", fontSize: 16, margin: 0 }}>{L.featuredSubtitle}</p>
            </div>
            <span onClick={goRooms} className="hf-navlink" style={{ cursor: "pointer", fontWeight: 700, fontSize: 14.5, color: "#2563eb", whiteSpace: "nowrap" }}>{L.viewAll} →</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
            {featuredRooms.map((r) => (
              <div key={r.id} className="hf-hoverlift" onClick={() => selectRoom(r.id)} style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 18, overflow: "hidden", cursor: "pointer" }}>
                <div style={{ position: "relative", height: 190, background: "linear-gradient(135deg,#dbe6f5,#eaf1ff)" }}>
                  <img src={r.cover} onError={imgErr} alt="room" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,.95)", borderRadius: 8, padding: "4px 9px", fontSize: 12, fontWeight: 700, color: "#0f172a", letterSpacing: 1 }}>{r.stars}</div>
                  <div style={{ position: "absolute", top: 12, right: 12, background: "#2563eb", color: "#fff", borderRadius: 8, padding: "5px 10px", fontSize: 13, fontWeight: 800 }}>{r.rating}</div>
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4, color: "#0f172a" }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14, lineHeight: 1.45, minHeight: 38 }}>{r.short}</div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <div><span style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{r.priceLabel}</span><span style={{ fontSize: 13, color: "#64748b" }}> / {L.night}</span></div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{L.viewDetail} →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section style={{ background: "#0b1f4d", marginTop: 80, padding: "64px 0" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}>
            <h2 style={{ color: "#fff", fontSize: 30, fontWeight: 800, letterSpacing: -0.8, margin: "0 0 32px", textAlign: "center" }}>{L.testimonialsTitle}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
              {testimonials.map((t, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, padding: 26 }}>
                  <div style={{ color: "#ffc94d", fontSize: 15, marginBottom: 12, letterSpacing: 2 }}>{t.stars}</div>
                  <p style={{ color: "rgba(255,255,255,.92)", fontSize: 15, lineHeight: 1.6, margin: "0 0 18px" }}>&ldquo;{t.text}&rdquo;</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(96,165,250,.25)", border: "1px solid rgba(96,165,250,.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#bfdbfe", fontWeight: 700, fontSize: 14 }}>{t.initials}</div>
                    <div>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                      <div style={{ color: "rgba(255,255,255,.55)", fontSize: 12.5 }}>{t.location}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ==================== FOOTER ====================
  function renderFooter() {
    const socials = ["facebook", "instagram", "xsocial", "youtube"];
    return (
      <footer style={{ background: "#081a3f", color: "#c7d3ea", marginTop: "auto" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "52px 24px 30px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 40 }}>
            <div>
              <div style={{ marginBottom: 14, lineHeight: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: -1.2, color: "#fff" }}>hotel<span style={{ color: "#60a5fa" }}>flow</span><span style={{ color: "#60a5fa" }}>.</span></div>
                <div style={{ fontSize: 8.5, letterSpacing: 3.5, color: "#6b81a8", fontWeight: 700, textTransform: "uppercase", marginTop: 3 }}>Beach Resort</div>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "#8ba0c4", maxWidth: 290, margin: "0 0 16px" }}>{L.footerTagline}</p>
              <div style={{ display: "flex", gap: 10 }}>
                {socials.map((s) => (
                  <span key={s} className="hf-btn" style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#c7d3ea" }}>
                    <Icon name={s} color="#c7d3ea" size={16} />
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 14 }}>{L.footerExplore}</div>
              <div onClick={goHome} className="hf-navlink" style={{ fontSize: 13.5, padding: "6px 0", cursor: "pointer", color: "#8ba0c4" }}>{L.navHome}</div>
              <div onClick={goRooms} className="hf-navlink" style={{ fontSize: 13.5, padding: "6px 0", cursor: "pointer", color: "#8ba0c4" }}>{L.navRooms}</div>
              <div onClick={goAdmin} className="hf-navlink" style={{ fontSize: 13.5, padding: "6px 0", cursor: "pointer", color: "#8ba0c4" }}>{L.navAdmin}</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 14 }}>{L.footerContact}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, padding: "6px 0", color: "#8ba0c4" }}><Icon name="mapPin" color="#8ba0c4" size={15} /> Playa del Carmen, MX</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, padding: "6px 0", color: "#8ba0c4" }}><Icon name="mail" color="#8ba0c4" size={15} /> hola@hotelflow.com</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, padding: "6px 0", color: "#8ba0c4" }}><Icon name="phone" color="#8ba0c4" size={15} /> +52 984 000 0000</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 14 }}>{L.footerDev}</div>
              <a href="http://fakumax.dev/" target="_blank" rel="noreferrer" className="hf-navlink" style={{ fontSize: 13.5, padding: "6px 0", color: "#60a5fa", textDecoration: "none", display: "inline-block", fontWeight: 600 }}>fakumax.dev</a>
            </div>
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,.1)", margin: "34px 0 20px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 13, color: "#6b81a8" }}>© 2026 Hotel Flow · {L.footerRights}</div>
            <div style={{ fontSize: 13, color: "#6b81a8" }}>{L.footerMadeBy} <a href="http://fakumax.dev/" target="_blank" rel="noreferrer" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 600 }}>fakumax.dev</a></div>
          </div>
        </div>
      </footer>
    );
  }

  // ==================== MODAL ====================
  function renderModal() {
    if (!modal) return null;
    return (
      <div onClick={closeModal} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(8,18,48,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} className="hf-fadein">
        <div onClick={stopProp} style={{ background: "#fff", borderRadius: 20, maxWidth: 440, width: "100%", padding: 30, boxShadow: "0 24px 60px rgba(0,0,0,.3)" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><Icon name={modal.iconName} color={modal.iconColor} size={40} /></div>
          <h3 style={{ fontSize: 21, fontWeight: 800, textAlign: "center", margin: "0 0 8px" }}>{modal.title}</h3>
          {modal.body && <p style={{ textAlign: "center", color: "#64748b", fontSize: 14.5, lineHeight: 1.55, margin: "0 0 8px" }}>{modal.body}</p>}
          {modal.hasDetails && (
            <div style={{ background: "#f8fafd", border: "1px solid #e8edf5", borderRadius: 12, padding: 16, margin: "14px 0 4px" }}>
              {modal.details.map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13.5 }}>
                  <span style={{ color: "#94a3b8", fontWeight: 600 }}>{d.k}</span><span style={{ fontWeight: 700, color: "#0f172a" }}>{d.v}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
            {modal.hasCancel && (
              <button onClick={closeModal} className="hf-btn" style={{ flex: 1, background: "#fff", color: "#475569", border: "1.5px solid #d8e0ee", borderRadius: 11, padding: 12, fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}>{L.modalClose}</button>
            )}
            <button onClick={resolveModal} className="hf-btn" style={{ flex: 1, background: modal.confirmBg, color: "#fff", border: "none", borderRadius: 11, padding: 12, fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}>{modal.confirmLabel}</button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== SEARCH BAR (shared home/results markup) ====================
  function renderSearchBar(compact) {
    return (
      <div
        style={
          compact
            ? { background: "#fff", border: "1px solid #e8edf5", borderRadius: 14, boxShadow: "0 2px 8px rgba(16,24,40,.05)", padding: 14, display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1.2fr auto", gap: 10, alignItems: "end", marginBottom: 24 }
            : { background: "#fff", border: "1px solid #e8edf5", borderRadius: 20, boxShadow: "0 20px 50px rgba(16,24,40,.14)", padding: 22 }
        }
      >
        <div>
          <label style={{ display: "block", fontSize: compact ? 11 : 12, fontWeight: 700, color: compact ? "#94a3b8" : "#64748b", marginBottom: compact ? 4 : 6 }}>{L.destination}</label>
          <input value={search.destination} onChange={onDest} style={{ width: "100%", border: "1px solid #d8e0ee", borderRadius: compact ? 9 : 11, padding: compact ? "10px 12px" : "13px 14px", fontSize: compact ? 14 : 15, fontWeight: 600 }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: compact ? 11 : 12, fontWeight: 700, color: compact ? "#94a3b8" : "#64748b", marginBottom: compact ? 4 : 6 }}>{L.checkIn}</label>
          <input type="date" value={search.checkIn} onChange={onCheckIn} style={{ width: "100%", border: "1px solid #d8e0ee", borderRadius: compact ? 9 : 11, padding: compact ? "9px 12px" : "12px 14px", fontSize: compact ? 13.5 : 14.5, fontWeight: 600 }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: compact ? 11 : 12, fontWeight: 700, color: compact ? "#94a3b8" : "#64748b", marginBottom: compact ? 4 : 6 }}>{L.checkOut}</label>
          <input type="date" value={search.checkOut} onChange={onCheckOut} style={{ width: "100%", border: "1px solid #d8e0ee", borderRadius: compact ? 9 : 11, padding: compact ? "9px 12px" : "12px 14px", fontSize: compact ? 13.5 : 14.5, fontWeight: 600 }} />
        </div>
        <div style={{ position: "relative" }}>
          <label style={{ display: "block", fontSize: compact ? 11 : 12, fontWeight: 700, color: compact ? "#94a3b8" : "#64748b", marginBottom: compact ? 4 : 6 }}>{L.guests}</label>
          <div onClick={toggleGuests} style={{ width: "100%", border: `1px solid ${guestsBorder}`, borderRadius: compact ? 9 : 11, padding: compact ? "9px 12px" : "13px 14px", fontSize: compact ? 13.5 : 14.5, fontWeight: 600, color: "#0f172a", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: compact ? 6 : 8 }}>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{guestsLabel}</span>
            <Icon name="chevronDown" color="#94a3b8" size={16} />
          </div>
          <GuestsDropdown />
        </div>
        <button onClick={runSearch} className="hf-btn" style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: compact ? 9 : 11, padding: compact ? "11px 22px" : "14px 26px", fontWeight: 700, fontSize: compact ? 14 : 15, cursor: "pointer", height: compact ? 41 : 49 }}>{L.searchBtn}</button>
      </div>
    );
  }

  // ==================== RESULTS ====================
  function renderResults() {
    const dotStyle = (active) => ({ border: active ? "#2563eb" : "#cbd5e6", dot: active ? "#2563eb" : "transparent" });
    const ratingOptions = [
      { v: 9, label: L.r_wonderful }, { v: 8, label: L.r_verygood }, { v: 7, label: L.r_good }, { v: 6, label: L.r_pleasant }, { v: 0, label: L.r_all },
    ];
    const typeOptions = [
      { v: "all", label: L.t_all }, { v: "suite", label: L.t_suite }, { v: "double", label: L.t_double },
      { v: "family", label: L.t_family }, { v: "single", label: L.t_single }, { v: "premium", label: L.t_premium },
    ];
    const starOptions = [2, 3, 4, 5];
    const sortOptions = [
      { key: "", label: L.s_choose }, { key: "priceLow", label: L.s_priceLow }, { key: "priceHigh", label: L.s_priceHigh }, { key: "rating", label: L.s_rating },
    ];
    const rooms = filteredRooms.map(cardInfo);
    const showEmpty = !loading && rooms.length === 0;
    const showList = !loading && rooms.length > 0;

    return (
      <div className="hf-fade" style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ padding: "16px 0 8px", fontSize: 13, color: "#64748b" }}>
          <span onClick={goHome} style={{ cursor: "pointer", color: "#2563eb", fontWeight: 600 }}>{L.navHome}</span>
          <span style={{ margin: "0 6px" }}>›</span>{L.breadResults}
        </div>

        {renderSearchBar(true)}

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 28, paddingBottom: 60, alignItems: "start" }}>
          {/* FILTERS */}
          <aside style={{ position: "sticky", top: 82 }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 18 }}>{L.filterBy}</div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{L.price}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>$ {filters.maxPrice}</span>
              </div>
              <input type="range" min={50} max={500} step={10} value={filters.maxPrice} onChange={onMaxPrice} style={{ width: "100%", accentColor: "#2563eb", cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 4 }}><span>$50</span><span>$500</span></div>
              <span onClick={clearFilters} style={{ display: "inline-block", marginTop: 12, fontSize: 13, fontWeight: 700, color: "#2563eb", cursor: "pointer" }}>{L.allPrices}</span>
            </div>

            <div style={{ height: 1, background: "#e8edf5", margin: "0 0 20px" }} />

            <div style={{ marginBottom: 22 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{L.rating}</div>
              {ratingOptions.map((ro) => {
                const s = dotStyle(filters.minRating === ro.v);
                return (
                  <div key={ro.v} onClick={() => setRating(ro.v)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", cursor: "pointer" }}>
                    <span style={{ width: 17, height: 17, borderRadius: "50%", border: `2px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot }} />
                    </span>
                    <span style={{ fontSize: 13.5, color: "#334155" }}>{ro.label}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginBottom: 22 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{L.roomTypeFilter}</div>
              {typeOptions.map((to) => {
                const s = dotStyle(filters.type === to.v);
                return (
                  <div key={to.v} onClick={() => setType(to.v)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", cursor: "pointer" }}>
                    <span style={{ width: 17, height: 17, borderRadius: "50%", border: `2px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot }} />
                    </span>
                    <span style={{ fontSize: 13.5, color: "#334155" }}>{to.label}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginBottom: 22 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{L.services}</div>
              {FILTER_SERVICES.map((k) => {
                const on = filters.services.includes(k);
                return (
                  <div key={k} onClick={() => toggleService(k)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", cursor: "pointer" }}>
                    <span style={{ width: 17, height: 17, borderRadius: 5, border: `2px solid ${on ? "#2563eb" : "#cbd5e6"}`, background: on ? "#2563eb" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                      {on && <Icon name="check" color="#fff" size={12} strokeWidth={3} />}
                    </span>
                    <span style={{ fontSize: 13.5, color: "#334155" }}>{SERVICE_META[k][lang]}</span>
                  </div>
                );
              })}
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{L.stars}</div>
              <div style={{ display: "flex", gap: 8 }}>
                {starOptions.map((s) => {
                  const on = filters.stars === s;
                  return (
                    <span key={s} onClick={() => setStars(s)} style={{ border: `1px solid ${on ? "#2563eb" : "#d8e0ee"}`, background: on ? "#eaf1ff" : "#fff", color: on ? "#2563eb" : "#475569", borderRadius: 9, padding: "7px 11px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{s}★</span>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* LIST */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>{rooms.length} {L.propertiesFound}</h2>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 3 }}>{L.sortBy}</label>
                <select value={sort} onChange={onSort} style={{ border: "1px solid #d8e0ee", borderRadius: 9, padding: "9px 12px", fontSize: 13.5, fontWeight: 600, background: "#fff", cursor: "pointer", minWidth: 190 }}>
                  {sortOptions.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "90px 0", gap: 16 }}>
                <div className="hf-spin" style={{ width: 42, height: 42, border: "4px solid #e3e9f4", borderTopColor: "#2563eb", borderRadius: "50%" }} />
                <div style={{ color: "#64748b", fontSize: 14, fontWeight: 600 }}>{L.loading}</div>
              </div>
            )}

            {showEmpty && (
              <div style={{ background: "#fff", border: "1px dashed #cbd5e6", borderRadius: 16, padding: "70px 30px", textAlign: "center" }}>
                <div style={{ marginBottom: 14, display: "flex", justifyContent: "center" }}><Icon name="search" color="#94a3b8" size={44} strokeWidth={1.6} /></div>
                <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 8 }}>{L.noResults}</div>
                <div style={{ color: "#64748b", fontSize: 14.5, marginBottom: 22, maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>{L.noResultsDesc}</div>
                <button onClick={clearFilters} className="hf-btn" style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{L.clearFilters}</button>
              </div>
            )}

            {showList && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {rooms.map((r) => (
                  <div key={r.id} className="hf-hoverlift" style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 16, overflow: "hidden", display: "grid", gridTemplateColumns: "260px 1fr", minHeight: 200 }}>
                    <div style={{ position: "relative", background: "linear-gradient(135deg,#dbe6f5,#eaf1ff)" }}>
                      <img src={r.cover} onError={imgErr} alt="room" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ padding: "20px 22px", display: "grid", gridTemplateColumns: "1fr auto", gap: 18 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 19, color: "#0f172a", marginBottom: 2 }}>{r.name}</div>
                        <div style={{ color: "#f59e0b", fontSize: 13, marginBottom: 8, letterSpacing: 1 }}>{r.stars}</div>
                        <div style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.5, marginBottom: 12, maxWidth: 440 }}>{r.short}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
                          {r.chips.map((c, i) => <span key={i} style={{ background: "#f0f4fb", color: "#475569", borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>{c}</span>)}
                        </div>
                        {r.eco && <div style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#16a34a", fontSize: 12.5, fontWeight: 700 }}><Icon name="leaf" color="#16a34a" size={14} /> {L.ecoFriendly}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", minWidth: 150 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{r.ratingLabel}</div>
                            <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{r.ratingCount} {L.ratingsWord}</div>
                          </div>
                          <div style={{ background: "#eaf1ff", color: "#2563eb", borderRadius: 9, padding: "8px 10px", fontSize: 16, fontWeight: 800, minWidth: 44, textAlign: "center" }}>{r.rating}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 2 }}>{r.guestsLine}</div>
                          <div style={{ marginBottom: 8 }}><span style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{r.priceLabel}</span><span style={{ fontSize: 12, color: "#94a3b8" }}> / {L.night}</span></div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => selectRoom(r.id)} className="hf-btn" style={{ background: "#fff", color: "#2563eb", border: "1.5px solid #2563eb", borderRadius: 9, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{L.viewDetail}</button>
                            <button onClick={() => bookRoom(r.id)} className="hf-btn" style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 9, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{L.book}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== DETAIL ====================
  function renderDetail() {
    if (!selectedRoom) return null;
    const room = selectedRoom;
    const imgs = room.images;
    const thumbs = imgs.map((id, i) => ({ url: IMG(id), i, active: galleryIndex === i }));
    let similar = ROOMS.filter((r) => r.id !== room.id && r.cat === room.cat).slice(0, 3);
    if (similar.length < 3) similar = ROOMS.filter((r) => r.id !== room.id).slice(0, 3);
    similar = similar.map(cardInfo);
    const tabs = [["desc", L.tab_desc], ["serv", L.tab_serv], ["comments", L.tab_comments], ["policy", L.tab_policy]];
    const rules = ROOM_RULES[lang];

    return (
      <div className="hf-fade" style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px 70px" }}>
        <div style={{ padding: "16px 0 18px", fontSize: 13, color: "#64748b" }}>
          <span onClick={goHome} style={{ cursor: "pointer", color: "#2563eb", fontWeight: 600 }}>{L.navHome}</span><span style={{ margin: "0 6px" }}>›</span>
          <span onClick={goRooms} style={{ cursor: "pointer", color: "#2563eb", fontWeight: 600 }}>{L.breadResults}</span><span style={{ margin: "0 6px" }}>›</span>{room.name[lang]}
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, margin: "0 0 6px" }}>{room.name[lang]}</h1>
            <div style={{ color: "#f59e0b", fontSize: 15, letterSpacing: 1, display: "flex", alignItems: "center" }}>
              {"★".repeat(room.stars)} <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#64748b", fontSize: 13.5, marginLeft: 10 }}><Icon name="mapPin" color="#94a3b8" size={14} /> {search.destination}, MX</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ background: "#eaf1ff", color: "#2563eb", borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{room.rating.toFixed(1)}</div>
              <div style={{ fontSize: 11, fontWeight: 700 }}>{ratingLabelFor(room.rating)}</div>
            </div>
          </div>
        </div>

        {/* GALLERY */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 12, marginBottom: 14 }}>
          <div style={{ position: "relative", height: 420, borderRadius: 16, overflow: "hidden", background: "linear-gradient(135deg,#dbe6f5,#eaf1ff)" }}>
            <img src={IMG(imgs[galleryIndex], 1200)} onError={imgErr} alt="room" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {thumbs.slice(0, 2).map((th) => (
                <div key={th.i} onClick={() => setGallery(th.i)} style={{ position: "relative", borderRadius: 14, overflow: "hidden", cursor: "pointer", background: "linear-gradient(135deg,#dbe6f5,#eaf1ff)", border: `2px solid ${th.active ? "#2563eb" : "transparent"}` }}>
                  <img src={th.url} onError={imgErr} alt="thumb" style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 130 }} />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {thumbs.slice(2, 4).map((th) => (
                <div key={th.i} onClick={() => setGallery(th.i)} style={{ position: "relative", borderRadius: 14, overflow: "hidden", cursor: "pointer", background: "linear-gradient(135deg,#dbe6f5,#eaf1ff)", border: `2px solid ${th.active ? "#2563eb" : "transparent"}` }}>
                  <img src={th.url} onError={imgErr} alt="thumb" style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 130 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start", marginTop: 26 }}>
          <div>
            <div style={{ borderBottom: "1px solid #e8edf5", display: "flex", gap: 6, marginBottom: 24 }}>
              {tabs.map(([k, label]) => (
                <span key={k} onClick={() => setDetailTab(k)} style={{ padding: "11px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", color: detailTab === k ? "#2563eb" : "#64748b", borderBottom: `2.5px solid ${detailTab === k ? "#2563eb" : "transparent"}` }}>{label}</span>
              ))}
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 12px" }}>{L.descriptionTitle}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "#475569", margin: "0 0 28px" }}>{room.long[lang]}</p>

            <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px" }}>{L.servicesTitle}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px 24px", marginBottom: 30 }}>
              {room.services.map((s) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 14.5, color: "#334155" }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: "#eaf1ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={SERVICE_META[s].ic} color="#2563eb" size={17} /></span>
                  {SERVICE_META[s][lang]}
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 14px" }}>{L.rulesTitle}</h3>
            <div style={{ background: "#f8fafd", border: "1px solid #e8edf5", borderRadius: 14, padding: "18px 20px" }}>
              {rules.map((ru, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", fontSize: 14, color: "#475569", borderBottom: i < rules.length - 1 ? "1px solid #eef2f8" : "none" }}>
                  <span style={{ color: "#2563eb" }}>•</span> {ru}
                </div>
              ))}
            </div>
          </div>

          {/* BOOKING WIDGET */}
          <div style={{ position: "sticky", top: 82, background: "#fff", border: "1px solid #e8edf5", borderRadius: 18, boxShadow: "0 10px 30px rgba(16,24,40,.08)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 18 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: "#0f172a" }}>{priceStr(room.price)}</span>
              <span style={{ fontSize: 14, color: "#64748b" }}>/ {L.night}</span>
            </div>
            <div style={{ border: "1px solid #d8e0ee", borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ padding: "11px 13px", borderRight: "1px solid #e8edf5" }}>
                  <label style={{ display: "block", fontSize: 10.5, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 3 }}>{L.checkIn}</label>
                  <input type="date" value={search.checkIn} onChange={onCheckIn} style={{ width: "100%", border: "none", fontSize: 13.5, fontWeight: 700, color: "#0f172a", padding: 0 }} />
                </div>
                <div style={{ padding: "11px 13px" }}>
                  <label style={{ display: "block", fontSize: 10.5, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 3 }}>{L.checkOut}</label>
                  <input type="date" value={search.checkOut} onChange={onCheckOut} style={{ width: "100%", border: "none", fontSize: 13.5, fontWeight: 700, color: "#0f172a", padding: 0 }} />
                </div>
              </div>
              <div style={{ padding: "11px 13px", borderTop: "1px solid #e8edf5", position: "relative" }}>
                <label style={{ display: "block", fontSize: 10.5, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 3 }}>{L.guests}</label>
                <div onClick={toggleGuests} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
                  <span>{guestsLabel}</span><Icon name="chevronDown" color="#94a3b8" size={16} />
                </div>
                <GuestsDropdown align="right" />
              </div>
            </div>

            <div style={{ fontSize: 14, color: "#475569" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span>{priceStr(room.price)} × {nights} {L.nightsWord}</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{"$" + subtotal}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span>{L.taxes} (12%)</span><span style={{ fontWeight: 600, color: "#0f172a" }}>{"$" + taxes}</span></div>
              <div style={{ height: 1, background: "#e8edf5", margin: "10px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: 17, fontWeight: 800, color: "#0f172a" }}><span>{L.total}</span><span>{"$" + total}</span></div>
            </div>

            <button onClick={goBooking} className="hf-btn" style={{ width: "100%", background: "#2563eb", color: "#fff", border: "none", borderRadius: 12, padding: 15, fontWeight: 700, fontSize: 16, cursor: "pointer", marginTop: 16 }}>{L.continueBooking}</button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "#94a3b8", marginTop: 10 }}><Icon name="lock" color="#94a3b8" size={13} /> {L.noCharge}</div>
          </div>
        </div>

        <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: "52px 0 20px" }}>{L.similarRooms}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {similar.map((r) => (
            <div key={r.id} className="hf-hoverlift" onClick={() => selectRoom(r.id)} style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 18, overflow: "hidden", cursor: "pointer" }}>
              <div style={{ height: 170, background: "linear-gradient(135deg,#dbe6f5,#eaf1ff)" }}><img src={r.cover} onError={imgErr} alt="room" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
              <div style={{ padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{r.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <div><span style={{ fontSize: 19, fontWeight: 800 }}>{r.priceLabel}</span><span style={{ fontSize: 12, color: "#94a3b8" }}> / {L.night}</span></div>
                  <span style={{ background: "#eaf1ff", color: "#2563eb", borderRadius: 7, padding: "4px 8px", fontSize: 13, fontWeight: 800 }}>{r.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==================== BOOKING ====================
  function renderBooking() {
    const b = booking;
    const t = touched;
    const errName = t && !b.fullName.trim() ? "#dc2626" : "#d8e0ee";
    const emailBad = t && !validEmail(b.email);
    const errEmail = emailBad ? "#dc2626" : "#d8e0ee";
    const errPhone = t && !b.phone.trim() ? "#dc2626" : "#d8e0ee";
    const emailErrMsg = t && b.email && !validEmail(b.email) ? L.invalidEmail : L.required;
    const inputStyle = (borderColor) => ({ width: "100%", border: `1.5px solid ${borderColor}`, borderRadius: 10, padding: "12px 14px", fontSize: 15 });

    return (
      <div className="hf-fade" style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 70px" }}>
        <div style={{ padding: "20px 0 8px", fontSize: 13, color: "#64748b" }}>
          <span onClick={backToDetail} style={{ cursor: "pointer", color: "#2563eb", fontWeight: 600 }}>‹ {L.back}</span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, margin: "0 0 26px" }}>{L.bookingTitle}</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 30, alignItems: "start" }}>
          <div style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 18, padding: 28 }}>
            <h3 style={{ fontSize: 19, fontWeight: 800, margin: "0 0 20px" }}>{L.guestData}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 18px" }}>
              <div style={{ gridColumn: "1/3" }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6 }}>{L.fullName} *</label>
                <input value={b.fullName} onChange={onName} placeholder={L.fullNamePh} style={inputStyle(errName)} />
                {t && !b.fullName.trim() && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 5, fontWeight: 600 }}>{L.required}</div>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6 }}>{L.email} *</label>
                <input value={b.email} onChange={onEmail} placeholder="tu@email.com" style={inputStyle(errEmail)} />
                {emailBad && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 5, fontWeight: 600 }}>{emailErrMsg}</div>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6 }}>{L.phone} *</label>
                <input value={b.phone} onChange={onPhone} placeholder="+52 ..." style={inputStyle(errPhone)} />
                {t && !b.phone.trim() && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 5, fontWeight: 600 }}>{L.required}</div>}
              </div>
              <div style={{ gridColumn: "1/3" }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6 }}>{L.document} <span style={{ color: "#94a3b8", fontWeight: 500 }}>({L.optional})</span></label>
                <input value={b.document} onChange={onDocument} style={inputStyle("#d8e0ee")} />
              </div>
              <div style={{ gridColumn: "1/3" }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6 }}>{L.comments}</label>
                <textarea value={b.comments} onChange={onComments} placeholder={L.commentsPh} rows={3} style={{ width: "100%", border: "1.5px solid #d8e0ee", borderRadius: 10, padding: "12px 14px", fontSize: 15, resize: "vertical", fontFamily: "inherit" }} />
              </div>
            </div>

            <h3 style={{ fontSize: 19, fontWeight: 800, margin: "30px 0 16px" }}>{L.payMethod}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div onClick={payHotel} style={{ border: `1.5px solid ${b.payment === "hotel" ? "#2563eb" : "#d8e0ee"}`, background: b.payment === "hotel" ? "#eaf1ff" : "#fff", borderRadius: 12, padding: 16, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Icon name="hotel" color="#2563eb" size={20} /><span style={{ fontWeight: 700, fontSize: 14.5 }}>{L.payAtHotel}</span></div>
                <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 6 }}>{L.payAtHotelDesc}</div>
              </div>
              <div onClick={payCard} style={{ border: `1.5px solid ${b.payment === "card" ? "#2563eb" : "#d8e0ee"}`, background: b.payment === "card" ? "#eaf1ff" : "#fff", borderRadius: 12, padding: 16, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Icon name="card" color="#2563eb" size={20} /><span style={{ fontWeight: 700, fontSize: 14.5 }}>{L.payCard}</span></div>
                <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 6 }}>{L.payCardDesc}</div>
              </div>
            </div>

            {b.payment === "card" && (
              <div style={{ background: "#f8fafd", border: "1px solid #e8edf5", borderRadius: 12, padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 8 }}>
                <div style={{ gridColumn: "1/3" }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>{L.cardNumber}</label>
                  <input value={b.card.number} onChange={onCardNumber} placeholder="4242 4242 4242 4242" style={{ width: "100%", border: "1px solid #d8e0ee", borderRadius: 9, padding: "11px 13px", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>{L.expiry}</label>
                  <input value={b.card.exp} onChange={onCardExp} placeholder="MM/AA" style={{ width: "100%", border: "1px solid #d8e0ee", borderRadius: 9, padding: "11px 13px", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>CVV</label>
                  <input value={b.card.cvv} onChange={onCardCvv} placeholder="123" style={{ width: "100%", border: "1px solid #d8e0ee", borderRadius: 9, padding: "11px 13px", fontSize: 14 }} />
                </div>
              </div>
            )}

            <div onClick={toggleTerms} style={{ display: "flex", alignItems: "flex-start", gap: 11, marginTop: 20, cursor: "pointer" }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${b.terms ? "#2563eb" : "#cbd5e6"}`, background: b.terms ? "#2563eb" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flex: "none", marginTop: 1 }}>
                {b.terms && <Icon name="check" color="#fff" size={13} strokeWidth={3} />}
              </span>
              <span style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.5 }}>{L.termsText} <span style={{ color: "#2563eb", fontWeight: 700 }}>{L.termsLink}</span></span>
            </div>
            {t && !b.terms && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 8, fontWeight: 600 }}>{L.termsRequired}</div>}

            <button onClick={confirmBooking} className="hf-btn" style={{ width: "100%", background: "#2563eb", color: "#fff", border: "none", borderRadius: 12, padding: 16, fontWeight: 700, fontSize: 16, cursor: "pointer", marginTop: 24 }}>{L.confirmBtn}</button>
          </div>

          <div style={{ position: "sticky", top: 82, background: "#fff", border: "1px solid #e8edf5", borderRadius: 18, overflow: "hidden", boxShadow: "0 10px 30px rgba(16,24,40,.08)" }}>
            <div style={{ height: 150, background: "linear-gradient(135deg,#dbe6f5,#eaf1ff)" }}><img src={IMG(activeRoom.images[0])} onError={imgErr} alt="room" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
            <div style={{ padding: 22 }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 2 }}>{activeRoom.name[lang]}</div>
              <div style={{ color: "#f59e0b", fontSize: 13, marginBottom: 16 }}>{"★".repeat(activeRoom.stars)}</div>
              <div style={{ fontSize: 14, color: "#475569" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span>{L.checkIn}</span><span style={{ fontWeight: 700, color: "#0f172a" }}>{fmtDate(search.checkIn)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span>{L.checkOut}</span><span style={{ fontWeight: 700, color: "#0f172a" }}>{fmtDate(search.checkOut)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span>{L.guests}</span><span style={{ fontWeight: 700, color: "#0f172a" }}>{guestsLabel}</span></div>
                <div style={{ height: 1, background: "#e8edf5", margin: "12px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>{priceStr(activeRoom.price)} × {nights} {L.nightsWord}</span><span style={{ color: "#0f172a" }}>{"$" + subtotal}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>{L.taxes}</span><span style={{ color: "#0f172a" }}>{"$" + taxes}</span></div>
                <div style={{ height: 1, background: "#e8edf5", margin: "12px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, fontWeight: 800, color: "#0f172a" }}><span>{L.total}</span><span>{"$" + total}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== CONFIRMATION ====================
  function renderConfirmation() {
    if (!confirmation) return null;
    const paymentLabel = confirmation.payment === "card" ? L.paymentLabel_card : L.paymentLabel_hotel;
    return (
      <div className="hf-fade" style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 78, height: 78, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}><Icon name="check" color="#16a34a" size={38} strokeWidth={2.5} /></div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, margin: "0 0 8px" }}>{L.confSuccess}</h1>
          <p style={{ color: "#64748b", fontSize: 15.5, margin: 0, lineHeight: 1.5 }}>{L.confDesc}</p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 20, overflow: "hidden", boxShadow: "0 12px 34px rgba(16,24,40,.1)" }}>
          <div style={{ background: "linear-gradient(120deg,#0b2a6b,#2563eb)", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff" }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{L.confCode}</div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 1, fontFamily: "ui-monospace,monospace" }}>{confirmation.code}</div>
            </div>
            <Icon name="waves" color="#fff" size={30} />
          </div>
          <div style={{ padding: 28 }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 22, paddingBottom: 22, borderBottom: "1px dashed #d8e0ee" }}>
              <div style={{ width: 88, height: 88, borderRadius: 12, overflow: "hidden", background: "linear-gradient(135deg,#dbe6f5,#eaf1ff)", flex: "none" }}><img src={IMG(activeRoom.images[0])} onError={imgErr} alt="room" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 3 }}>{activeRoom.name[lang]}</div>
                <div style={{ color: "#f59e0b", fontSize: 13, marginBottom: 6 }}>{"★".repeat(activeRoom.stars)}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#64748b" }}><Icon name="mapPin" color="#94a3b8" size={14} /> {search.destination}, MX</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", fontSize: 14 }}>
              <div><div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{L.confGuest}</div><div style={{ fontWeight: 700, color: "#0f172a" }}>{confirmation.guest}</div></div>
              <div><div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{L.guests}</div><div style={{ fontWeight: 700, color: "#0f172a" }}>{guestsLabel}</div></div>
              <div><div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{L.checkIn}</div><div style={{ fontWeight: 700, color: "#0f172a" }}>{fmtDate(search.checkIn)}</div></div>
              <div><div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{L.checkOut}</div><div style={{ fontWeight: 700, color: "#0f172a" }}>{fmtDate(search.checkOut)}</div></div>
            </div>
            <div style={{ background: "#f8fafd", borderRadius: 12, padding: "16px 18px", marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>{L.total} · {nights} {L.nightsWord}</div><div style={{ fontSize: 12, color: "#64748b" }}>{paymentLabel}</div></div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{"$" + confirmation.total}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={goHome} className="hf-btn" style={{ flex: 1, background: "#fff", color: "#2563eb", border: "1.5px solid #2563eb", borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{L.backHome}</button>
          <button onClick={goAdmin} className="hf-btn" style={{ flex: 1, background: "#2563eb", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{L.myReservations}</button>
        </div>
      </div>
    );
  }

  // ==================== ADMIN ====================
  function renderAdmin() {
    const statusMeta = {
      pending: { bg: "#fef3c7", color: "#b45309", label: L.st_pending },
      confirmed: { bg: "#dcfce7", color: "#15803d", label: L.st_confirmed },
      cancelled: { bg: "#fee2e2", color: "#b91c1c", label: L.st_cancelled },
    };
    let resList = reservations;
    if (statusFilter !== "all") resList = resList.filter((r) => r.status === statusFilter);
    const adminReservations = resList.map((r) => {
      const rm = getRoom(r.roomId);
      const n = Math.max(1, Math.round((new Date(r.checkOut) - new Date(r.checkIn)) / 86400000));
      const tot = r._total || Math.round(rm.price * n * 1.12);
      const sm = statusMeta[r.status];
      return { ...r, roomName: rm.name[lang], sm, total: tot };
    });

    const confirmedRes = reservations.filter((r) => r.status === "confirmed");
    const revenue = confirmedRes.reduce((s, r) => {
      const rm = getRoom(r.roomId);
      const n = Math.max(1, Math.round((new Date(r.checkOut) - new Date(r.checkIn)) / 86400000));
      return s + (r._total || Math.round(rm.price * n * 1.12));
    }, 0);
    const upcoming = reservations.filter((r) => r.status !== "cancelled" && new Date(r.checkIn) >= new Date("2026-07-01")).length;

    const stats = [
      { icon: "calendar", iconBg: "#eaf1ff", iconColor: "#2563eb", label: L.st_total, value: reservations.length, delta: "+12%" },
      { icon: "bed", iconBg: "#dcfce7", iconColor: "#15803d", label: L.st_occupied, value: `${confirmedRes.length}/6`, delta: "" },
      { icon: "dollar", iconBg: "#fef3c7", iconColor: "#b45309", label: L.st_revenue, value: "$" + revenue.toLocaleString("en-US"), delta: "+8%" },
      { icon: "door", iconBg: "#f3e8ff", iconColor: "#7c3aed", label: L.st_checkins, value: upcoming, delta: "" },
    ];
    const statusFilters = [["all", L.f_all], ["pending", L.st_pending], ["confirmed", L.st_confirmed], ["cancelled", L.st_cancelled]];
    const adminRooms = ROOMS.map((r, i) => ({ ...r, avail: i !== 3 }));

    return (
      <div className="hf-fade" style={{ maxWidth: 1240, margin: "0 auto", padding: "26px 24px 70px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, margin: "0 0 4px" }}>{L.adminTitle}</h1>
            <p style={{ color: "#64748b", fontSize: 14.5, margin: 0 }}>{L.adminSubtitle}</p>
          </div>
          <div style={{ display: "flex", gap: 8, background: "#eef2f8", borderRadius: 11, padding: 4 }}>
            <span onClick={setAdminReservations} style={{ cursor: "pointer", padding: "9px 16px", borderRadius: 8, fontSize: 13.5, fontWeight: 700, background: adminTab === "reservations" ? "#fff" : "transparent", color: adminTab === "reservations" ? "#2563eb" : "#64748b" }}>{L.reservationsTab}</span>
            <span onClick={setAdminRooms} style={{ cursor: "pointer", padding: "9px 16px", borderRadius: 8, fontSize: 13.5, fontWeight: 700, background: adminTab === "rooms" ? "#fff" : "transparent", color: adminTab === "rooms" ? "#2563eb" : "#64748b" }}>{L.roomsTab}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 28 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 16, padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={s.icon} color={s.iconColor} size={19} /></div>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5 }}>{s.value}</div>
              {s.delta && <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginTop: 2 }}>{s.delta}</div>}
            </div>
          ))}
        </div>

        {adminTab === "reservations" && (
          <div style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #eef2f8" }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{L.reservationsTable}</div>
              <div style={{ display: "flex", gap: 8 }}>
                {statusFilters.map(([v, label]) => {
                  const on = statusFilter === v;
                  return (
                    <span key={v} onClick={() => setStatusFilter(v)} style={{ cursor: "pointer", padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: `1px solid ${on ? "#2563eb" : "#e3e9f4"}`, background: on ? "#eaf1ff" : "#fff", color: on ? "#2563eb" : "#64748b" }}>{label}</span>
                  );
                })}
              </div>
            </div>
            <div className="hf-scroll" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
                <thead>
                  <tr style={{ background: "#f8fafd", textAlign: "left" }}>
                    <th style={{ padding: "13px 20px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{L.thCode}</th>
                    <th style={{ padding: "13px 16px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{L.thGuest}</th>
                    <th style={{ padding: "13px 16px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{L.thRoom}</th>
                    <th style={{ padding: "13px 16px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{L.thCheckIn}</th>
                    <th style={{ padding: "13px 16px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{L.thCheckOut}</th>
                    <th style={{ padding: "13px 16px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{L.thStatus}</th>
                    <th style={{ padding: "13px 16px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{L.thTotal}</th>
                    <th style={{ padding: "13px 20px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "right" }}>{L.thActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {adminReservations.map((r) => (
                    <tr key={r.code} style={{ borderTop: "1px solid #eef2f8" }}>
                      <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 700, fontFamily: "ui-monospace,monospace", color: "#2563eb" }}>{r.code}</td>
                      <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{r.guest}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13.5, color: "#475569" }}>{r.roomName}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13.5, color: "#475569" }}>{fmtDate(r.checkIn)}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13.5, color: "#475569" }}>{fmtDate(r.checkOut)}</td>
                      <td style={{ padding: "14px 16px" }}><span style={{ display: "inline-block", padding: "4px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: r.sm.bg, color: r.sm.color }}>{r.sm.label}</span></td>
                      <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{"$" + r.total}</td>
                      <td style={{ padding: "14px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>
                          {r.status === "pending" && (
                            <span onClick={() => askConfirm(r.code)} title={L.confirm} className="hf-step" style={{ cursor: "pointer", width: 30, height: 30, borderRadius: 8, border: "1px solid #bbf7d0", background: "#f0fdf4", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}><Icon name="check" color="#16a34a" size={16} strokeWidth={2.5} /></span>
                          )}
                          {r.status !== "cancelled" && (
                            <span onClick={() => askCancel(r.code)} title={L.cancel} className="hf-step" style={{ cursor: "pointer", width: 30, height: 30, borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}><Icon name="x" color="#dc2626" size={16} strokeWidth={2.5} /></span>
                          )}
                          <span onClick={() => showDetailModal(r)} title={L.viewDetail} className="hf-step" style={{ cursor: "pointer", width: 30, height: 30, borderRadius: 8, border: "1px solid #e3e9f4", background: "#f8fafd", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><Icon name="eye" color="#64748b" size={15} /></span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminTab === "rooms" && (
          <div style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", fontWeight: 800, fontSize: 17, borderBottom: "1px solid #eef2f8" }}>{L.roomsTab}</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafd", textAlign: "left" }}>
                  <th style={{ padding: "13px 20px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{L.roomName}</th>
                  <th style={{ padding: "13px 16px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{L.roomPrice}</th>
                  <th style={{ padding: "13px 16px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{L.capacity}</th>
                  <th style={{ padding: "13px 16px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{L.thStatus}</th>
                  <th style={{ padding: "13px 20px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "right" }}>{L.thActions}</th>
                </tr>
              </thead>
              <tbody>
                {adminRooms.map((r) => (
                  <tr key={r.id} style={{ borderTop: "1px solid #eef2f8" }}>
                    <td style={{ padding: "13px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 9, overflow: "hidden", background: "linear-gradient(135deg,#dbe6f5,#eaf1ff)", flex: "none" }}><img src={IMG(r.images[0])} onError={imgErr} alt="room" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                        <div><div style={{ fontWeight: 700, fontSize: 14 }}>{r.name[lang]}</div><div style={{ color: "#f59e0b", fontSize: 12, letterSpacing: 1 }}>{"★".repeat(r.stars)}</div></div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{priceStr(r.price)}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13.5, color: "#475569" }}>{r.cap} {guestsWord} · {r.bed[lang]}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{ display: "inline-block", padding: "4px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: r.avail ? "#dcfce7" : "#fee2e2", color: r.avail ? "#15803d" : "#b91c1c" }}>{r.avail ? L.available : L.unavailable}</span>
                    </td>
                    <td style={{ padding: "13px 20px", textAlign: "right" }}>
                      <span onClick={editRoom} className="hf-btn" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, background: "#eef2f8", color: "#2563eb", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 700 }}><Icon name="wrench" color="#2563eb" size={14} /> {L.edit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f6f8fc" }}>
      {renderNavbar()}
      <main style={{ flex: 1 }}>
        {screen === "home" && renderHome()}
        {screen === "results" && renderResults()}
        {screen === "detail" && renderDetail()}
        {screen === "booking" && renderBooking()}
        {screen === "confirmation" && renderConfirmation()}
        {screen === "admin" && renderAdmin()}
      </main>
      {renderFooter()}
      {renderModal()}
    </div>
  );
}
