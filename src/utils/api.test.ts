import fetchMock from 'fetch-mock';
import { api, storageKey } from './api';

interface Test {
  id: number;
  name: string;
}

describe('API Test', () => {
  const token = 'asdf';

  beforeEach(() => {
    fetchMock.mock('end:api/authenticate', { token, expireInSeconds: 9999999999999 });
    sessionStorage.setItem(storageKey, JSON.stringify({ token, expireInSeconds: 9999999999999, expiresAt: 9999999999999 }));
  });

  afterEach(() => {
    sessionStorage.removeItem(storageKey);
    fetchMock.reset();
  });

  describe('when the api is not authenticated', () => {
    it('it will make a request to authenticate and then make the original Request', async () => {
      sessionStorage.removeItem(storageKey);
      const resource = '/api/tests';
      const response = [{ id: 1, name: 'Test 1' }];
      fetchMock.mock('end:/api/tests', response);

      const responseJson = await api<Test[]>(resource);

      expect(fetchMock.calls().length).toBe(1);
      expect(fetchMock.called('end:api/authenticate')).toBe(false);
      expect(fetchMock.lastCall()![0]).toContain('/api/tests');
      expect(fetchMock.lastCall()![1]!.headers).toMatchObject({ Authorization: `` });
      expect(responseJson).toEqual(response);
    });
  });

  describe('when the api is already authenticated', () => {
    it('will make the original request ', async () => {
      const resource = '/api/tests';
      const response = [{ id: 1, name: 'Test 1' }];
      fetchMock.mock('end:/api/tests', response);
      const responseJson = await api<Test[]>(resource);

      expect(fetchMock.calls().length).toBe(1);
      expect(fetchMock.lastCall()![0]).toContain('/api/tests');
      expect(fetchMock.lastCall()![1]!.headers).toMatchObject({ Authorization: `` });
      expect(responseJson).toEqual(response);
    });
  });

  describe('when a signal is passed in the options', () => {
    it('will make the request, passing the signal as a property to the fetch init options', async () => {
      const resource = '/api/tests';
      const response = [{ id: 1, name: 'Test 1' }];
      fetchMock.mock('end:/api/tests', response);
      const abortController = new AbortController();
      const responseJson = await api<Test[]>(resource, { signal: abortController.signal });

      expect(fetchMock.calls().length).toBe(1);
      expect(fetchMock.lastCall()![1]!.signal).toBe(abortController.signal);
      expect(responseJson).toEqual(response);
    });
  });

  describe('Error Handling', () => {
    describe('when fetch responds with an HTTP ERROR', () => {
      it('will throw an error', async () => {
        fetchMock.mock('end:/api/tests', 404);
        await expect(api('/api/tests')).rejects.toThrow('Unhandled API Exception: 404 Not Found');
      });
    });

    describe('When a Abort Error is fired', () => {
      it('will swallow the error', async () => {
        const error = new Error('Abort Error');
        (error as unknown as Record<string, number>).code = 20;
        fetchMock.mock('end:/api/tests', Promise.reject(error));

        const response = await api('/api/tests');
        expect(response).toBe(undefined);
      });
    });
  });

  describe('HTTP METHODS', () => {
    describe('GET Tests', () => {
      it('will make a GET request through the api', async () => {
        const resource = '/api/tests/1';
        const response = [{ id: 1, name: 'Test 1' }];
        fetchMock.get('end:/api/tests/1', response);
        const responseJson = await api.get<Test[]>(resource);

        expect(fetchMock.calls().length).toBe(1);
        expect(fetchMock.lastCall()![0]).toBe(resource);
        expect(responseJson).toEqual(response);
      });
    });
  });
});
