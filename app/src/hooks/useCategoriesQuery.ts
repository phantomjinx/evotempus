import { useQuery } from '@tanstack/react-query'
import { fetchService } from '@evotempus/api'

export const useCategoriesQuery = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchService.subjectCategories(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

}
