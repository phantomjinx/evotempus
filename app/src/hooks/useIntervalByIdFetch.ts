import { useQueryClient } from '@tanstack/react-query'
import { fetchService } from '@evotempus/api'

export const useIntervalByIdFetch = () => {
  const queryClient = useQueryClient()

  // Return an async function that the UI component can call on demand
  return async (id: string) => {
    return queryClient.fetchQuery({
      queryKey: ['intervalById', id],
      queryFn: async () => {
        const response = await fetchService.intervalById(id)
        return response.data
      },
      staleTime: 5 * 60 * 1000,
    })
  }
}
