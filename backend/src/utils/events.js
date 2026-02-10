const toDateOnly = (value) => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      return new Date(year, month, day);
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const getEventState = (eventDate, now = new Date()) => {
  if (!eventDate) return 'COMING_SOON';

  const eventDay = toDateOnly(eventDate);
  if (!eventDay) return 'COMING_SOON';

  const today = toDateOnly(now) || new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (eventDay.getTime() >= today.getTime()) {
    return 'UPCOMING';
  }

  return 'PAST';
};

module.exports = {
  getEventState,
  toDateOnly,
};
