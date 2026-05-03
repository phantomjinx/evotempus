import { useQueryClient } from '@tanstack/react-query'
import { fetchService } from '@evotempus/api'

export const useIntervalEnclosesFetch = () => {
  const queryClient = useQueryClient()

  // Return an async function that the UI component can call on demand
  return async (from: number, to: number) => {
    return queryClient.fetchQuery({
      queryKey: ['intervalEncloses', from, to],
      queryFn: async () => {
        const response = await fetchService.intervalEncloses(from, to)
        return response.data
      },
      staleTime: 5 * 60 * 1000
    })
  }
}
