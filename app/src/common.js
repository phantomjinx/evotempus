
export var million = 1000000;

export function displayYear(year) {
  return (Math.abs(year) > million) ? (year / million) + "Ma" : year;
}

export function present(year) {
  return (year === 2030) ? new Date().getFullYear() : displayYear(year);
}
