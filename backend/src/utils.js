/*
 * Copyright (C) 2020 Paul G. Richardson
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

function toBoolean(value, defaultVal) {
  if (!value) {
    return defaultVal;
  }

  switch(value.toLowerCase().trim()) {
    case "true": case "yes": case "1": return true;
    case "false": case "no": case "0": case null: return false;
    default: return Boolean(value);
  }
}

function displayName(id) {
  // Replace hypens with spaces
  name = id.replace(/-/g, " ");

  // Capitalize all words
  var s = name.toLowerCase().split(' ');
  for (var i = 0; i < s.length; i++) {
    // Assign it back to the array
    s[i] = s[i].charAt(0).toUpperCase() + s[i].substring(1);
  }

  return s.join(' ');
}

function parseNumber(numStr, id) {
  n = parseInt(numStr.trim());
  if (isNaN(n)) {
    throw "ERROR: Cannot convert 'from' value: " + numStr.trim() + " for id: " + id;
  }

  return n;
}

module.exports = {
  toBoolean,
  displayName,
  parseNumber
};
