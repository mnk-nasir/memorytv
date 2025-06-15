/**
 * data.js
 * Sample media items and channel definitions.
 * Replace with real API data from Google Drive / Photos / iCloud.
 */

const MEDIA_ITEMS = [
  { emoji: '🏔️', title: 'Swiss Alps Hiking',    date: 'Aug 2025', type: 'photo', src: 'photos', loc: 'Switzerland', people: 'Family', thumb: 'assets/samples/sample-alps.png', url: 'assets/samples/sample-alps.png' },
  { emoji: '🏖️', title: 'Bali Beach Sunset',     date: 'Jun 2025', type: 'photo', src: 'photos', loc: 'Bali',        people: 'Friends', thumb: 'assets/samples/sample-bali.png', url: 'assets/samples/sample-bali.png' },
  { emoji: '🌸', title: 'Kyoto Temple Walk',     date: 'Apr 2025', type: 'photo', src: 'photos', loc: 'Kyoto',       people: 'Friends', thumb: 'assets/samples/sample-kyoto.png', url: 'assets/samples/sample-kyoto.png' },
  { emoji: '🌲', title: 'Redwood Picnic',        date: 'Jul 2025', type: 'photo', src: 'photos', loc: 'California',  people: 'Family', thumb: 'assets/samples/sample-forest.png', url: 'assets/samples/sample-forest.png' },
  { emoji: '🌊', title: 'Icelandic Waterfall',   date: 'May 2025', type: 'video', src: 'drive',  loc: 'Iceland',     people: 'Nature', thumb: 'assets/samples/sample-alps.png', url: 'assets/samples/sample-waterfall.mp4' },
  { emoji: '🥗', title: 'Garden Breakfast',      date: 'Sep 2025', type: 'video', src: 'drive',  loc: 'Home',        people: 'Family', thumb: 'assets/samples/sample-forest.png', url: 'assets/samples/sample-garden.mp4' },
];

const ALBUM_ITEMS = [
  { emoji: '🏔️', title: 'Alps Adventure',        date: '142 items', type: 'album', src: 'photos', loc: 'Switzerland', thumb: 'assets/samples/sample-alps.png' },
  { emoji: '🌴', title: 'Bali Memories',        date: '89 items',  type: 'album', src: 'photos', loc: 'Bali',        thumb: 'assets/samples/sample-bali.png' },
  { emoji: '🍣', title: 'Japan Exploration',     date: '55 items',  type: 'album', src: 'photos', loc: 'Kyoto',       thumb: 'assets/samples/sample-kyoto.png' },
  { emoji: '🏡', title: 'Family Roots',          date: '201 items', type: 'album', src: 'photos', loc: 'Home',        thumb: 'assets/samples/sample-forest.png' },
];

const TV_ITEMS = [
  { thumb: 'assets/samples/sample-alps.png',   url: 'assets/samples/sample-alps.png',   type: 'photo', title: 'Family hike in Swiss Alps',   sub: '📍 Switzerland · 👤 Family · 📅 Aug 2025',   tags: ['Family','Travel','Nature'] },
  { thumb: 'assets/samples/sample-waterfall.mp4', url: 'assets/samples/sample-waterfall.mp4', type: 'video', title: 'Icelandic Waterfall',       sub: '📍 Iceland · 👤 Nature · 📅 May 2025',       tags: ['Nature','Drone','Waterfall'] },
  { thumb: 'assets/samples/sample-bali.png',   url: 'assets/samples/sample-bali.png',   type: 'photo', title: 'Friends in Bali at Sunset',  sub: '📍 Bali · 👤 Friends · 📅 Jun 2025',         tags: ['Friends','Travel','Beach'] },
  { thumb: 'assets/samples/sample-kyoto.png',  url: 'assets/samples/sample-kyoto.png',  type: 'photo', title: 'Kyoto Cherry Blossoms',     sub: '📍 Kyoto · 👤 Friends · 📅 Apr 2025',        tags: ['Friends','Culture','Japan'] },
  { thumb: 'assets/samples/sample-garden.mp4',  url: 'assets/samples/sample-garden.mp4',  type: 'video', title: 'Garden Moments',            sub: '📍 Home · 👤 Family · 📅 Sep 2025',          tags: ['Family','Home','Lifestyle'] },
  { thumb: 'assets/samples/sample-forest.png', url: 'assets/samples/sample-forest.png', type: 'photo', title: 'Redwood Forest Picnic',    sub: '📍 California · 👤 Family · 📅 Jul 2025',    tags: ['Family','Nature','Hiking'] },
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
