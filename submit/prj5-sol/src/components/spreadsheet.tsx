import React, { useEffect, useState } from 'react';
import SpreadsheetWs from '../lib/ss-ws.js';
import { Result, okResult, errResult } from 'cs544-js-utils';
import { Errors, makeElement } from '../lib/utils.js';

const [N_ROWS, N_COLS] = [10, 10];

type SpreadsheetData = {
  [cellId: string]: { expr: string, value: number }
};

interface Props {
  ws: SpreadsheetWs;
  ssName: string;
}

const Spreadsheet: React.FC<Props> = ({ ws, ssName }) => {
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetData>({});
  const [focusedCellId, setFocusedCellId] = useState<string>('');
  const [copySrcCellId, setCopySrcCellId] = useState<string | undefined>(undefined);
  const errors = new Errors();

  useEffect(() => {
    const load = async () => {
      const loadResult = await ws.dumpWithValues(ssName);
      if (!loadResult.isOk) {
        errors.display(loadResult.errors);
      } else {
        errors.clear();
        setSpreadsheetData(loadResult.val.reduce((acc, [cellId, expr, value]) => ({
          ...acc,
          [cellId]: { expr, value }
        }), {}));
      }
    };
    load();
  }, []);

  const clearSpreadsheet = async () => {
    const clearResult = await ws.clear(ssName);
    if (clearResult.isOk) {
      errors.clear();
      setSpreadsheetData({});
    } else {
      errors.display(clearResult.errors);
    }
  };

  const focusCell = (cellId: string) => {
    setFocusedCellId(cellId);
  };

  const blurCell = async (cellId: string, expr: string) => {
    const updatesResult =
      expr.length > 0
        ? await ws.evaluate(ssName, cellId, expr)
        : await ws.remove(ssName, cellId);
    if (updatesResult.isOk) {
      errors.clear();
      setSpreadsheetData(prevData => ({
        ...prevData,
        [cellId]: { ...prevData[cellId], expr },
        ...Object.fromEntries(Object.entries(updatesResult.val).map(([cellId, value]) => [cellId, { ...prevData[cellId], value }]))
      }));
      
      
    } else {
      errors.display(updatesResult.errors);
    }
    setFocusedCellId('');
  };

  const copyCell = (cellId: string) => {
    setCopySrcCellId(cellId);
  };

  // const pasteCell = async (destCellId: string) => {
  //   if (!copySrcCellId) return;
  //   const srcCellId = copySrcCellId;
  //   setCopySrcCellId(undefined);
  //   const updatesResult = await ws.copy(ssName, destCellId, srcCellId);
  //   const queryResult = await ws.query(ssName, destCellId);
  //   if (updatesResult.isOk && queryResult.isOk) {
  //     errors.clear();
  //     setSpreadsheetData(prevData => ({
  //       ...prevData,
  //       [destCellId]: { ...prevData[destCellId], expr: queryResult.val.expr },
  //       ...Object.fromEntries(Object.entries(updatesResult.val).map(([cellId, value]) => [cellId, { ...prevData[cellId], value }]))
  //     }));
      
  //   } else if (!updatesResult.isOk) {
  //     errors.display(updatesResult.errors);
  //   } else if (!queryResult.isOk) {
  //     errors.display(queryResult.errors);
  //   }
  // };
  const pasteCell = async (destCellId: string) => {
    if (!copySrcCellId) return;
    const srcCellId = copySrcCellId;
    setCopySrcCellId(undefined);
    const updatesResult = await ws.copy(ssName, destCellId, srcCellId);
    const queryResult = await ws.query(ssName, destCellId);
    if (updatesResult.isOk && queryResult.isOk) {
      errors.clear();
      setSpreadsheetData(prevData => ({
        ...prevData,
        [destCellId]: { ...prevData[destCellId], expr: queryResult.val.expr },
        ...Object.fromEntries(Object.entries(updatesResult.val).map(([cellId, value]) => [cellId, { ...prevData[cellId], value }]))
      }));
      setCopySrcCellId(undefined);
    } else if (!updatesResult.isOk) {
      errors.display(updatesResult.errors);
    } else if (!queryResult.isOk) {
      errors.display(queryResult.errors);
    }
  };
  

  return (
    <>
      <button id="clear" onClick={clearSpreadsheet}>Clear</button>
      <table>
        <thead>
          <tr>
            <th></th>
            {[...Array(N_COLS)].map((_, colIdx) =>
              <th key={colIdx}>{String.fromCharCode('A'.charCodeAt(0) + colIdx)}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {[...Array(N_ROWS)].map((_, rowIdx) =>
            <tr key={rowIdx}>
              <th>{rowIdx + 1}</th>
              {[...Array(N_COLS)].map((_, colIdx) => {
                const cellId = String.fromCharCode('a'.charCodeAt(0) + colIdx) + (rowIdx + 1);
                return (
                  <td key={colIdx}>
                    <Cell
                      cellId={cellId}
                      data={spreadsheetData[cellId]}
                      isFocused={focusedCellId === cellId}
                      isCopySource={copySrcCellId === cellId}
                      onFocus={() => focusCell(cellId)}
                      onBlur={(expr: string) => blurCell(cellId, expr)}
                      onCopy={() => copyCell(cellId)}
                      onPaste={() => pasteCell(cellId)}
                    />
                  </td>
                );
              })}
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
};

interface CellProps {
  cellId: string;
  data?: { expr: string; value: number };
  isFocused: boolean;
  isCopySource: boolean;
  onFocus: () => void;
  onBlur: (expr: string) => void;
  onCopy: () => void;
  onPaste: () => void;
}

const Cell: React.FC<CellProps> = ({
  cellId,
  data,
  isFocused,
  isCopySource,
  onFocus,
  onBlur,
  onCopy,
  onPaste
}) => {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    if (isFocused) {
      setContent(data?.expr ?? '');
    } else {
      setContent(data?.value?.toString() ?? '');
    }
  }, [data, isFocused]);

  return (
    <input
      id={cellId}
      className={`cell ${isCopySource ? 'is-copy-source' : ''}`}
      value={content}
      onChange={e => setContent(e.target.value)}
      onFocus={onFocus}
      onBlur={() => onBlur(content)}
      onCopy={onCopy}
      onPaste={onPaste}
    />
  );
};

export default Spreadsheet;
