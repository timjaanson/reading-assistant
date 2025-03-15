export const getLocalDateTimeWithWeekday = (): string => {
  const now = new Date();
  let locale;

  try {
    // navigator.language should return the user's preferred locale (e.g., "en-US")
    locale = navigator && navigator.language ? navigator.language : undefined;
  } catch (error) {
    locale = undefined;
  }

  const dayOfWeek = now.toLocaleDateString(locale, { weekday: "long" });
  const fullDate = now.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const localTime = now.toLocaleTimeString(locale);

  return `${dayOfWeek}, ${fullDate}, ${localTime}`;
};
