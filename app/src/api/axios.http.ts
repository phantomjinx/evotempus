import axios from 'axios'

const instance = axios.create({
  // Allows for repointing to an alternative backend server:port if required
  baseURL: process.env.DATA_SERVER_HOST || '/',
  headers: {
    // Any headers that are required
  },
  params: {
    outputsize: 'compact',
    datatype: 'json',
  },
})

instance.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response
  },
  function (error) {
    let err = error

    if (error.response && error.response.data) {
      err = new Error(error.response.data)
    }
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(err)
  },
)

export { instance }
