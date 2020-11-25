import axios from 'axios'

const instance = axios.create({
    // Allows for repointing to an alternative backend server:port if required
    baseURL: process.env.REACT_APP_DATA_SERVER_HOST || '/',
    headers: {
        // Any headers that are required
    }
});

export function intervals() {
  return instance({
    'method':'GET',
    'url':'/api/intervals',
    'params': {
      'outputsize':'compact',
      'datatype':'json'
    },
  });
}

export function intervalById(id) {
  return instance({
    'method':'GET',
    'url':'/api/intervals/' + id,
    'params': {
      'outputsize':'compact',
      'datatype':'json'
    },
  });
}

export function intervalEncloses(from, to) {
  return instance({
    'method':'GET',
    'url':'/api/intervals',
    'params': {
      'from': from,
      'to': to,
      'limited': true, // Ensures that the single narrowest interval is returned
      'outputsize':'compact',
      'datatype':'json'
    },
  });
}

export function description(topicType, topicId) {
  return instance({
    'method':'GET',
    'url':'/api/' + topicType + 's/description/' + topicId,
    'params': {
      'outputsize':'compact',
      'datatype':'json'
    },
  });
}

export function subjectById(id) {
  return instance({
    'method':'GET',
    'url':'/api/subjects/' + id,
    'params': {
      'outputsize':'compact',
      'datatype':'json'
    },
  });
}

export function subjectsWithin(from, to) {
  return instance({
    'method':'GET',
    'url':'/api/subjects',
    'params': {
      'from':from,
      'to':to,
      'outputsize':'compact',
      'datatype':'json'
    },
  });
}

export function subjectCategories() {
  return instance({
    'method':'GET',
    'url':'/api/subjects/categories',
    'params': {
      'outputsize':'compact',
      'datatype':'json'
    },
  });
}

export function search(searchTerm) {
  return instance({
    'method':'GET',
    'url':'/api/search',
    'params': {
      'query':searchTerm,
      'outputsize':'compact',
      'datatype':'json'
    },
  });
}
