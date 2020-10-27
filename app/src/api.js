import axios from 'axios'

const instance = axios.create({
    baseURL: process.env.REACT_APP_DATA_SERVER_HOST,
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

export function description(intervalId) {
  return instance({
    'method':'GET',
    'url':'/api/intervals/description/' + intervalId,
    'params': {
      'outputsize':'compact',
      'datatype':'json'
    },
  });
}

export function subjects(from, to) {
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
