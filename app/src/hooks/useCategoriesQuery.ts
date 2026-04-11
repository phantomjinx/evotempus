import { useQuery } from '@tanstack/react-query'
import { fetchService } from '@evotempus/api'

export const useCategoriesQuery = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetchService.subjectCategories()
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

}
