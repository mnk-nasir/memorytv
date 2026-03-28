/**
 * data.js
 * Sample media items and channel definitions.
 * Replace with real API data from Google Drive / Photos / iCloud.
 */

const MEDIA_ITEMS = [
  { emoji: '🌅', title: 'Maldives Sunset',    date: 'Aug 2024', type: 'photo', src: 'photos', loc: 'Maldives',  people: 'Sarah, James' },
  { emoji: '🎂', title: "Emma's Birthday",    date: 'Jun 2024', type: 'video', src: 'drive',  loc: 'London',    people: 'Emma, Family' },
  { emoji: '🗼', title: 'Paris Trip',          date: 'May 2024', type: 'photo', src: 'photos', loc: 'Paris',     people: 'Sarah' },
  { emoji: '🏖️', title: 'Beach Day',          date: 'Jul 2024', type: 'photo', src: 'photos', loc: 'Brighton',  people: 'James' },
  { emoji: '🎓', title: 'Graduation Day',      date: 'Jul 2024', type: 'video', src: 'drive',  loc: 'Oxford',    people: 'Emma' },
  { emoji: '🎄', title: 'Christmas 2023',      date: 'Dec 2023', type: 'album', src: 'photos', loc: 'Home',      people: 'Family' },
  { emoji: '🌊', title: 'Cornwall Waves',      date: 'Apr 2024', type: 'video', src: 'drive',  loc: 'Cornwall',  people: 'Dad' },
  { emoji: '🌸', title: 'Spring Garden',       date: 'Mar 2024', type: 'photo', src: 'photos', loc: 'Home',      people: 'Mum' },
];

const ALBUM_ITEMS = [
  { emoji: '☀️', title: 'Summer 2024',       date: '142 items', type: 'album', src: 'photos', loc: 'Various' },
  { emoji: '✈️', title: 'Europe Trip',        date: '89 items',  type: 'album', src: 'drive',  loc: 'Paris, Rome' },
  { emoji: '👨‍👩‍👧‍👦', title: 'Family Reunion',  date: '55 items',  type: 'album', src: 'photos', loc: 'Manchester' },
  { emoji: '🎸', title: 'Concerts & Gigs',    date: '34 items',  type: 'album', src: 'drive',  loc: 'London' },
  { emoji: '🐶', title: 'Pets',               date: '201 items', type: 'album', src: 'photos', loc: 'Home' },
  { emoji: '🏔️', title: 'Scotland Hike',      date: '67 items',  type: 'album', src: 'drive',  loc: 'Scotland' },
];

const TV_ITEMS = [
  { emoji: '🌅', title: 'Summer Holiday, Maldives',   sub: '📍 Maldives · 👤 Sarah, James · 📅 Aug 2024',  tags: ['Holiday','Beach','Family','Google Photos'] },
  { emoji: '🗼', title: 'Paris — Eiffel Tower',        sub: '📍 Paris · 👤 Sarah · 📅 May 2024',             tags: ['Travel','City','Google Photos'] },
  { emoji: '🎂', title: 'Birthday Party, London',      sub: '📍 London · 👤 Emma, Family · 📅 Jun 2024',     tags: ['Birthday','Family','Google Drive'] },
  { emoji: '🏖️', title: 'Beach Day, Brighton',        sub: '📍 Brighton · 👤 James · 📅 Jul 2024',          tags: ['Beach','Summer','Google Photos'] },
  { emoji: '🎓', title: 'Graduation Day, Oxford',      sub: '📍 Oxford · 👤 Emma · 📅 Jul 2024',             tags: ['Graduation','Family','Google Drive'] },
  { emoji: '🌊', title: 'Cornwall Coastline',          sub: '📍 Cornwall · 👤 Dad · 📅 Apr 2024',            tags: ['Travel','Nature','Google Drive'] },
  { emoji: '🌸', title: 'Spring Garden',               sub: '📍 Home · 👤 Mum · 📅 Mar 2024',               tags: ['Home','Spring','Google Photos'] },
  { emoji: '🐶', title: 'Puppy Moments',               sub: '📍 Home · 📅 Feb 2024',                         tags: ['Pets','Home','Google Photos'] },
  { emoji: '☀️', title: 'Summer Album 2024',           sub: '📍 Various · 📅 Summer 2024',                   tags: ['Album','Summer','Google Photos'] },
  { emoji: '✈️', title: 'Europe Trip',                 sub: '📍 Paris, Rome · 📅 May 2024',                  tags: ['Travel','Europe','Google Drive'] },
];

const PLAYLISTS = [
  { emoji: '🌅', name: 'Summer 2024',     count: 142, duration: '8s' },
  { emoji: '🎂', name: 'Birthdays',       count: 87,  duration: '10s' },
  { emoji: '✈️', name: 'Travel Memories', count: 312, duration: '6s' },
  { emoji: '👨‍👩‍👧‍👦', name: 'Family Moments',  count: 219, duration: '8s' },
];

const SOURCES = [
  { id: 'drive',  name: 'Google Drive',  icon: '📁', type: 'Cloud Storage',    connected: true,  count: '2,341 items' },
  { id: 'photos', name: 'Google Photos', icon: '🌄', type: 'Photo Library',    connected: true,  count: '8,752 photos' },
  { id: 'apple',  name: 'Apple iCloud',  icon: '🍎', type: 'iCloud Photos',    connected: false, count: null },
  { id: 'local',  name: 'Local Storage', icon: '💾', type: 'Device / USB',     connected: false, count: null },
];
