import { useEffect, useState, useReducer } from 'react';
import { AuthToken } from '../../types/AuthToken';

const storageKey = 'adazzle_api_token_v1';
enum ERROR_CODES {
  ABORT_ERROR = 20
}

const getResponseBody = <T>(response: Response): Promise<T> => {
  if (response.ok) {
    return response as unknown as Promise<T>;
  }

  return getError(response);
};

const getJson = <T>(response: Response): Promise<T> => {
  if (response.ok) {
    if (response.status === 204) {
      return response.text() as unknown as Promise<T>;
    }
    return response.json().then(data => data.users);
  }

  return getError(response);
};

const getError = async (response: Response): Promise<never> => {
  const contentType = response.headers.get('Content-Type');
  if (contentType?.includes('application/json')) {
    const error = await response.json();
    return Promise.reject(error);
  }

  return Promise.reject(response);
};

async function call<T>(resource: RequestInfo, responseFormatter: (response: Response) => Promise<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(resource, init);
  return responseFormatter(response);
}

function getMilliseconds(seconds: number): number {
  return seconds * 1000;
}

// function isAuthenticated(): boolean {
//   const token = getToken();
//   return !!(
//     token?.token
//     && token.expiresAt
//     && token.expiresAt > Date.now()
//   );
// }

// function checkAuthentication(signal?: AbortSignal): Promise<AuthToken | undefined> {
//   // if (isAuthenticated()) {
//     return Promise.resolve(getToken());
//   // }

//   // return authenticate(signal);
// }

function saveToken(token?: AuthToken) {
  if (token) {
    token.expiresAt = Date.now() + getMilliseconds(token.expireInSeconds);
    sessionStorage.setItem(storageKey, JSON.stringify(token));
  }
}

// async function authenticate(signal?: AbortSignal): Promise<AuthToken | undefined> {
//   const options = {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json;charset=UTF-8'
//     },
//     signal
//   };

//   try {
//     const token = await call<AuthToken>(`${process.env.WEBAPP_API_PREFIX}/api/authenticate`, getJson, options);
//     saveToken(token);
//     return token;
//   } catch (error) {
//     logout();

//     if (error.code === ERROR_CODES.ABORT_ERROR) {
//       return Promise.resolve(undefined);
//     }

//     return Promise.reject(error);
//   }
// }

// function logout(): void {
//   sessionStorage.removeItem(storageKey);
// }

// function getToken(): AuthToken | undefined {
//   const token = sessionStorage.getItem(storageKey);
//   if (token) {
//     return JSON.parse(token);
//   }
//   return undefined;
// }

const api = async<T>(resource: RequestInfo, options?: RequestInit, responseFormatter?: (response: Response) => Promise<T>) => {
  try {
    // const token = await checkAuthentication();
    const init = {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Authorization: ``//`Bearer ${token!.token}`
      },
      ...options
    };

    // for backwards compatibility this parameter was made optional, so revert to default i.e. getAsJson
    if (responseFormatter === undefined) {
      return await call<T>(resource, getJson, init);
    }

    return await call<T>(resource, responseFormatter, init);
  } catch (error) {
    if (error.code === ERROR_CODES.ABORT_ERROR) {
      return;
    }

    // this can be different if the api controller returns pascal case...normalize?
    if (error.Message || error.message) {
      throw error;
    }

    if (error.Error) {
      throw error.Error;
    }

    throw new Error(`Unhandled API Exception: ${error.status} ${error.statusText}`);
  }
};

api.getResponseBody = (resource: RequestInfo, signal?: AbortSignal) => api(resource, { signal }, getResponseBody);

api.get = <T>(resource: RequestInfo, signal?: AbortSignal) => api<T>(resource, { signal });

api.post = <T>(resource: RequestInfo, body: unknown, signal?: AbortSignal) =>
  api<T>(resource, {
    method: 'POST',
    body: JSON.stringify(body),
    signal
  });

api.put = <T>(resource: RequestInfo, body: unknown, signal?: AbortSignal) =>
  api<T>(resource, {
    method: 'PUT',
    body: JSON.stringify(body),
    signal
  });

api.patch = <T>(resource: RequestInfo, body: unknown, signal?: AbortSignal) =>
  api<T>(resource, {
    method: 'PATCH',
    body: JSON.stringify(body),
    signal
  });

api.delete = <T>(resource: RequestInfo, signal?: AbortSignal) =>
  api<T>(resource, {
    method: 'DELETE',
    signal
  });

export interface UseApiState<T> {
  data?: T;
  loading: boolean;
  error?: string;
  refresh: () => void;
}

const useApi = <T>(url: string, initialData?: T): UseApiState<T> => {
  const [reload, doReload] = useReducer((x: number) => x + 1, 0);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let isRunning = true;
    const abortController = new AbortController();
    async function fetchData() {
      setError(undefined);
      setLoading(true);

      try {
        const result = await api<T>(url, { signal: abortController.signal });

        if (isRunning) {
          setData(result as T);
        }
      } catch (error) {
        if (isRunning) {
          if (error.ExceptionMessage) {
            setError(error.ExceptionMessage);
          } else if (error.Message || error.message) {
            setError(error.Message || error.message);
          } else {
            setError(`${error.status} ${error.statusText}`);
          }
        }
      }

      if (isRunning) {
        setLoading(false);
      }
    }

    fetchData();

    return function cleanUp() {
      isRunning = false;
      abortController.abort();
    };
  }, [reload, url]);

  return { data, loading, error, refresh: doReload };
};

export { api, useApi, storageKey, saveToken };
