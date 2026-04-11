import { useQuery } from '@tanstack/react-query'
import { fetchService } from '@evotempus/api'

export const useIntervalsQuery = () => {
  return useQuery({
    queryKey: ['intervals'],
    queryFn: async () => {
      const response = await fetchService.intervals()
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
