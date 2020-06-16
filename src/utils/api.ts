import { useEffect, useState, useReducer } from 'react';
import { AuthToken } from '../../types/AuthToken';

const storageKey = 'api_token_v1';
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
    return response.json();
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

function saveToken(token?: AuthToken) {
  if (token) {
    token.expiresAt = Date.now() + getMilliseconds(token.expireInSeconds);
    sessionStorage.setItem(storageKey, JSON.stringify(token));
  }
}

const api = async<T>(resource: RequestInfo, options?: RequestInit, responseFormatter?: (response: Response) => Promise<T>) => {
  try {
    const init = {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Authorization: ``
      },
      ...options
    };

    if (responseFormatter === undefined) {
      return await call<T>(resource, getJson, init);
    }

    return await call<T>(resource, responseFormatter, init);
  } catch (error) {
    if (error.code === ERROR_CODES.ABORT_ERROR) {
      return;
    }

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

export interface UseApiState<T> {
  data?: T;
  loading: boolean;
  error?: string;
  refresh: () => void;
}

export { api, storageKey, saveToken };
