import { expect, test, jest } from '@jest/globals';
import { hints } from './support.test';
import axiosInstance from './axios.http';

jest.mock('./axios.http');
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

import { FetchService } from './fetch.service';

var fetchService: FetchService;

beforeEach(() => {
  fetchService = new FetchService();
});

describe("fetch.service.test", () => {
  test("fetch hints", async () => {
    mockedAxios.get.mockResolvedValue({
      data: hints,
    });

    const response = await fetchService.hints();
    expect(response).toEqual({data: hints});
  });
});
