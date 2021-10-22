import ColorHash from 'color-hash'

export var million = 1000000;
export var thousand = 1000;
export var wikiLink = "https://en.wikipedia.org/wiki/";

var hints = {};
var kinds = [];
var categoryHints = [];
var colorHash = new ColorHash();

export function setHints(hintArr) {
  hints = {};
  for (const h of hintArr.values()) {
    hints[h._id] = {
      colour: h.colour,
      link: h.link,
      order: h.order,
      parent: h.parent
    };

    if (h.type === 'Kind') {
      kinds.push(h._id);
    } else if (h.type === 'Category') {
      categoryHints.push(h._id);
    }
  }

  kinds = sortKinds(kinds);
}

export function getKinds() {
  return kinds;
}

export function getCategoryHints() {
  return categoryHints;
}

export function sortKinds(kindArr) {
  kindArr.sort((a, b) => {
    return hints[a].order - hints[b].order;
  });

  return kindArr;
}

export function hasHintColour(hint) {
  return hint && hint.colour && hint.colour.length > 0;
}

export function hasHintLink(hint) {
  return hint && hint.link && hint.link.length > 0;
}

export function getHint(name) {
  const hint = hints[name];
  return (hint) ? hint : {};
}

export function calcColour(name) {
  const hint = hints[name];
  return hasHintColour(hint) ? hint.colour : colorHash.hex(name);
}

export function calcColours(names) {
  const colours = [];
  for (const name of names.values()) {
    colours.push(calcColour(name));
  }
  return colours;
}

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
