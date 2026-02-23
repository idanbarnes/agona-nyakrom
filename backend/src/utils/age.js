const toComparableDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      return Number.isNaN(utcDate.getTime()) ? null : utcDate;
    }
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseAge = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }

  return Math.trunc(numericValue);
};

const computeAgeFromDates = (dateOfBirth, dateOfDeath) => {
  const birth = toComparableDate(dateOfBirth);
  const death = toComparableDate(dateOfDeath);

  if (!birth || !death) {
    return null;
  }

  let age = death.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = death.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && death.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const resolveAge = (rawAge, dateOfBirth, dateOfDeath) =>
  parseAge(rawAge) ?? computeAgeFromDates(dateOfBirth, dateOfDeath);

module.exports = {
  computeAgeFromDates,
  resolveAge,
};
