
export var million = 1000000;
export var thousand = 1000;

export function displayYear(year) {
  if (Math.abs(year) > million) {
    return (year / million) + "Ma";
  } else if (Math.abs(year) > thousand) {
    return (year / thousand) + "ka";
  } else {
    return year;
  }
}

export function present(year) {
  return (year === 2030) ? new Date().getFullYear() : displayYear(year);
}
