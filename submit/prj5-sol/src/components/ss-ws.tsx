import { Err, ErrResult, Result, okResult, errResult } from 'cs544-js-utils';
import { useEffect, useState } from 'react';

type Updates = { [cellId: string]: number };

export default function SpreadsheetWs({ apiUrl }: { apiUrl: string }) {
  const makeURL = (url: string, queryParams: Record<string, string | number> = {}) => {
    const urlObj = new URL(url);
    Object.entries(queryParams).forEach(([k, v]) => {
      urlObj.searchParams.append(k, v.toString());
    });
    return urlObj;
  };

  async function doFetchJson<T>(
    method: string,
    url: URL,
    jsonBody?: object
  ): Promise<Result<T>> {
    const options: { [key: string]: any } = { method };
    if (jsonBody) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(jsonBody);
    }
    try {
      const response = await fetch(url.toString(), options);
      const data = await response.json();
      return data.isOk ? okResult(data.result) : new ErrResult(data.errors);
    } catch (err) {
      console.error(err);
      return errResult(err);
    }
  }

  async function query(
    ssName: string,
    cellId: string
  ): Promise<Result<{ value: number; expr: string }>> {
    const url = makeURL(`${apiUrl}/${ssName}/${cellId}`);
    return await doFetchJson('GET', url);
  }

  async function remove(ssName: string, cellId: string): Promise<Result<Updates>> {
    const url = makeURL(`${apiUrl}/${ssName}/${cellId}`);
    return await doFetchJson('DELETE', url);
  }

  async function copy(
    ssName: string,
    destCellId: string,
    srcCellId: string
  ): Promise<Result<Updates>> {
    const url = makeURL(`${apiUrl}/${ssName}/${destCellId}`, { srcCellId });
    return await doFetchJson('PATCH', url);
  }

  async function evaluate(
    ssName: string,
    cellId: string,
    expr: string
  ): Promise<Result<Updates>> {
    const url = makeURL(`${apiUrl}/${ssName}/${cellId}`, { expr });
    return await doFetchJson('PATCH', url);
  }

  async function dump(ssName: string): Promise<Result<[string, string][]>> {
    const url = makeURL(`${apiUrl}/${ssName}`);
    return await doFetchJson('GET', url);
  }

  async function dumpWithValues(
    ssName: string
  ): Promise<Result<[string, string, number][]>> {
    const url = makeURL(`${apiUrl}/${ssName}`, { doValues: 'true' });
    return await doFetchJson('GET', url);
  }

  async function load(ssName: string, dump: [string, string][]): Promise<Result<undefined>> {
    const url = makeURL(`${apiUrl}/${ssName}`);
    return await doFetchJson('PUT', url, dump);
  }

  async function clear(ssName: string): Promise<Result<undefined>> {
    const url = makeURL(`${apiUrl}/${ssName}`);
    return await doFetchJson('DELETE', url);
  }

  return {
    query,
    remove,
    copy,
    evaluate,
    dump,
    dumpWithValues,
    load,
    clear,
  };
}
