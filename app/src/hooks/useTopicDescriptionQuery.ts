import { useQuery } from '@tanstack/react-query'
import { fetchService } from '@evotempus/api'

export const useTopicDescriptionQuery = (type?: string, id?: string) => {
  return useQuery({
    queryKey: ['description', type, id],
    queryFn: async () => {
      // The non-null assertions (!) are safe here because queryFn
      // only runs if 'enabled' is true
      const res = await fetchService.description(type!, id!)
      return res.data
    },
    enabled: !!type && !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}
