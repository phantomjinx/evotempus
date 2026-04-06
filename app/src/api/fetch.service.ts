/*
 * Copyright (C) 2026 P. G. Richardson
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
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
