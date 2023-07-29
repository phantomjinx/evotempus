import { expect, test, jest } from '@jest/globals'
import { hints } from './support.test'
import { instance as http } from './axios.http'
import { fetchService } from './fetch.service'

jest.mock('./axios.http')
const mockedAxios = http as jest.Mocked<typeof http>

describe('fetch.service.test', () => {
  test('fetch hints', async () => {
    mockedAxios.get.mockResolvedValue({
      data: hints,
    })

    const response = await fetchService.hints()
    expect(response).toEqual({ data: hints })
  })
})
