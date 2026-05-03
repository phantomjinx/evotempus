import { useQueryClient } from '@tanstack/react-query'
import { fetchService } from '@evotempus/api'

export const useSearchFetch = () => {
  const queryClient = useQueryClient()

  // Return an async function that the UI component can call on demand
  return async (searchTerm: string) => {
    return queryClient.fetchQuery({
      queryKey: ['search', searchTerm],
      queryFn: async () => {
        const response = await fetchService.search(searchTerm)
        return response.data
      },
      staleTime: 5 * 60 * 1000
    })
  }
}
