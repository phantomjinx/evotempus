
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

export function identifier(text) {
  return text.replace(/\s/g, '-').toLowerCase();
}

export function idToTitle(id) {
  // Replace hypens with spaces
  const name = id.replace(/-/g, " ");

  // Capitalize all words
  const s = name.toLowerCase().split(' ');
  for (var i = 0; i < s.length; i++) {
    // Assign it back to the array
    s[i] = s[i].charAt(0).toUpperCase() + s[i].substring(1);
  }

  return s.join(' ');
}
