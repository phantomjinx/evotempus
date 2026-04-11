import { useQuery } from '@tanstack/react-query'
import { fetchService } from '@evotempus/api'

export const useHintsQuery = () => {
  return useQuery({
    queryKey: ['hints'],
    queryFn: async () => {
      const response = await fetchService.hints()
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
