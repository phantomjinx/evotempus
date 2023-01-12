import {
  Interval,
  Subject,
  Topic
} from '@evotempus/types';

export var DEBUG = false;
export var million = 1000000;
export var thousand = 1000;
export var wikiLink = "https://en.wikipedia.org/wiki/";

import geoclockIcon from '@evotempus/assets/images/geologic-clock-icon32.png';
import topicIcon from '@evotempus/assets/images/topic-icon.png';
import animalIcon from '@evotempus/assets/images/animal-icon.png';
import eventIcon from '@evotempus/assets/images/event-icon.png';
import geologyIcon from '@evotempus/assets/images/geology-icon.png';
import microIcon from '@evotempus/assets/images/micro-icon.png';
import fungusIcon from '@evotempus/assets/images/fungus-icon.png';
import plantIcon from '@evotempus/assets/images/plant-icon.png';

export function displayYear(year: number) {
  if (Math.abs(year) > million) {
    return (year / million) + "Ma";
  } else if (Math.abs(year) > thousand) {
    return (year / thousand) + "ka";
  } else {
    return year;
  }
}

export function present(year: number) {
  return (year === 2030) ? new Date().getFullYear() : displayYear(year);
}

export function identifier(text: string) {
  return text.replace(/\s/g, '-').toLowerCase();
}

export function idToTitle(id: string) {
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

export function consoleLog(obj: any) {
  if (! DEBUG) {
    return;
  }

  console.log(obj);
}

export function isInterval(object: any): boolean {
  return (object as Interval).parent !== undefined;
}

export function isSubject(object: any): boolean {
  return (object as Subject).category !== undefined;
}

export function isTopic(object: any): boolean {
  return (object as Topic).topicTarget !== undefined;
}

export function getListIcon(object: any): string {

  if (isInterval(object)) {
    return geoclockIcon;
  } else if (isTopic(object)) {
    return topicIcon;
  } else if (isSubject(object)) {
    const subject = object as Subject;
    switch (subject.kind) {
      case 'Animal':
        return animalIcon;
      case 'Event':
        return eventIcon;
      case 'Geology':
        return geologyIcon;
      case 'Micro':
        return microIcon;
      case 'Fungus':
        return fungusIcon;
      case 'Plant':
        return plantIcon;
    }
  }

  return geoclockIcon;
}
