/**
 * filters.js
 * Filter logic for people, events, and location chips.
 * Extend this to connect with real API query parameters.
 */

const activeFilters = {
  people:   'All',
  events:   'All',
  location: 'All',
};

function toggleChip(el) {
  const group    = el.closest('.filter-group');
  const category = group.querySelector('.filter-title').textContent.toLowerCase();
  const siblings = group.querySelectorAll('.chip');

  siblings.forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  const value = el.textContent.trim();
  if (category.includes('people'))   activeFilters.people   = value;
  if (category.includes('events'))   activeFilters.events   = value;
  if (category.includes('location')) activeFilters.location = value;

  applyFilters();
  showToast('Filter: ' + value);
}

function applyFilters() {
  const items = MEDIA_ITEMS.filter(m => {
    const peopleOk   = activeFilters.people   === 'All' || (m.people && m.people.includes(activeFilters.people));
    const locationOk = activeFilters.location === 'All' || (m.loc    && m.loc.includes(activeFilters.location));
    return peopleOk && locationOk;
  });
  buildGrid(items, 'media-grid-recent');
}
