import { instance as http } from './axios.http'
import { Hint, Results, SubjectCriteria } from '@evotempus/types'

class FetchService {
  intervals() {
    return http({
      method: 'GET',
      url: '/api/intervals',
    })
  }

  intervalById(id: string) {
    return http({
      method: 'GET',
      url: '/api/intervals/' + id,
    })
  }

  intervalEncloses(from: number, to: number) {
    return http({
      method: 'GET',
      url: '/api/intervals',
      params: {
        from: from,
        to: to,
        limited: true, // Ensures that the single narrowest interval is returned
      },
    })
  }

  description(topicType: string, topicId: string) {
    return http({
      method: 'GET',
      url: '/api/' + topicType + 's/description/' + topicId,
    })
  }

  subjectById(id: string) {
    return http({
      method: 'GET',
      url: '/api/subjects/' + id,
    })
  }

  subjectsWithin(criteria: SubjectCriteria) {
    return http({
      method: 'POST',
      url: '/api/subjects',
      data: {
        from: criteria.interval ? criteria.interval.from : undefined,
        to: criteria.interval ? criteria.interval.to : undefined,
        kind: criteria.kind,
        page: criteria.page,
        subject: criteria.subjectId,
        excluded: criteria.excludedCategories,
      },
    })
  }

  subjectCategories() {
    return http.get<string[]>('/api/subjects/categories')
  }

  search(searchTerm: string) {
    return http.get<Results>('/api/search', {
      params: {
        query: searchTerm,
      },
    })
  }

  hints() {
    return http.get<Hint[]>('/api/hints')
  }
}

export const fetchService = new FetchService()
