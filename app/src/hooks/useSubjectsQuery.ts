import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchService } from '@evotempus/api'
import { SubjectCriteria } from '@evotempus/types'

export const useSubjectsQuery = (criteria: SubjectCriteria, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['subjects', criteria],
    queryFn: async () => {
      const response = await fetchService.subjectsWithin(criteria)
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled,
    // Do not unmount the UI when the criteria changes
    placeholderData: keepPreviousData
  })
}
