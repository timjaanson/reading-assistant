export const getLocalDateTimeWithWeekday = (): string => {
  const now = new Date();
  let locale;

  try {
    locale = navigator && navigator.language ? navigator.language : undefined;
  } catch (error) {
    locale = undefined;
  }

  return now.toLocaleString(locale, {
    weekday: "long",

    year: "numeric",
    month: "long",
    day: "numeric",

    hour: "numeric",
    minute: "numeric",
    second: "numeric",

    timeZoneName: "short",
  });
};
