// Mamatha & Tarun Kumar - 3 Dec 2026, 12:13 PM, Yanagundi
export const couple = {
  bride: { name: 'Mamatha', parent: 'Daughter of Smt. Jayashree & Sri Buggoji Harihar — Only daughter' },
  groom: { name: 'Tarun Kumar', parent: 'Son of late Smt. Sunanda & Sri Narayana jee — Elder son' },
};

export const weddingDate = '2026-12-03T12:13:00+05:30';

export const venue = {
  name: 'Shri Manikeshwari Function Hall',
  place: 'Yanagundi, Tq. Sedam',
  district: 'Dist. Gulbarga (Kalaburagi) - 585214',
  mapsName: 'Mata Manikeshwari Kalyana Mantapa, Yenagundi, Karnataka 585214',
  mapsLink: 'https://maps.app.goo.gl/rcJCYjZG4eWpAJqR9'
};

export const events = [
  {
    title: 'Mamatha weds Tarun Kumar',
    label: 'Wedding ceremony — Muhurta 12:13 PM',
    start: '2026-12-03T12:13:00+05:30',
    end: '2026-12-03T15:30:00+05:30',
    venue: `${venue.name}, ${venue.place}`,
    note: 'Bride: Mamatha — Daughter of Jayashree & Buggoji Harihar (only daughter). Groom: Tarun Kumar — Son of late Sunanda & Narayana jee (elder son).',
  },
  {
    title: 'Blessings & Lunch',
    label: 'Reception — Lunch to follow at same venue',
    start: '2026-12-03T13:30:00+05:30',
    end: '2026-12-03T17:00:00+05:30',
    venue: venue.name,
    note: `Yanagundi, Sedam, Gulbarga - 585214. ${venue.mapsName}. Open in Maps: ${venue.mapsLink}`,
  },
];