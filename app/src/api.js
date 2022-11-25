import axios from 'axios'

const instance = axios.create({
    // Allows for repointing to an alternative backend server:port if required
    baseURL: process.env.REACT_APP_DATA_SERVER_HOST || '/',
    headers: {
        // Any headers that are required
    }
});

instance.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  },
  function (error) {
    let err = error;

    if (error.response && error.response.data) {
      err = new Error(error.response.data);
    }
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(err);
  }
);

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

export function subjectsWithin(from, to, kind, page, subjectId, excludedCategories) {
  return instance({
    'method':'POST',
    'url':'/api/subjects',
    'data': {
      'from': from,
      'to': to,
      'kind': kind,
      'page': page,
      'subject': subjectId,
      'excluded': excludedCategories
    },
    'params': {
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

export function hints() {
  return instance({
    'method':'GET',
    'url':'/api/hints',
    'params': {
      'outputsize':'compact',
      'datatype':'json'
    },
  });
}
