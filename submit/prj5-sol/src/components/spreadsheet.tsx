import React, { useEffect, useState } from 'react';
import SpreadsheetWs from '../lib/ss-ws.js';
import { Result, okResult, errResult } from 'cs544-js-utils';
import { Errors, makeElement } from '../lib/utils.js';

const [N_ROWS, N_COLS] = [10, 10];

interface CellData {
  expr: string;
  value: number;
}

interface CellProps {
  data: CellData;
  id: string;
  onFocus: (id: string) => void;
  onBlur: (id: string, newValue: string) => void;
}

const Cell: React.FC<CellProps> = ({ data, id, onFocus, onBlur }) => {
  const [focused, setFocused] = useState(false);
  const [content, setContent] = useState(data.expr);

  useEffect(() => {
    if (focused) {
      onFocus(id);
    }
  }, [focused, id, onFocus]);

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
    onBlur(id, content);
  };

  return (
    <td
      id={id}
      className="cell"
      contentEditable={true}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {content}
    </td>
  );
};

interface SpreadsheetProps {
  ws: SpreadsheetWs;
  ssName: string;
}

const Spreadsheet: React.FC<SpreadsheetProps> = ({ ws, ssName }) => {
  const [spreadsheetData, setSpreadsheetData] = useState<CellData[][]>(
    new Array(N_ROWS).fill(null).map(() =>
      new Array(N_COLS).fill({ expr: '', value: 0 })
    )
  );
  const [focusedCellId, setFocusedCellId] = useState('');

  useEffect(() => {
    const loadSpreadsheet = async () => {
      const loadResult = await ws.dumpWithValues(ssName);
      if (loadResult.isOk) {
        const updatedData: CellData[][] = Array.from(spreadsheetData);

        loadResult.val.forEach(([cellId, expr, value]) => {
          const [col, row] = cellId.match(/[A-Za-z]+|\d+/g) || [];
          if (col && row) {
            const rowIndex = parseInt(row) - 1;
            const colIndex = col.charCodeAt(0) - 'A'.charCodeAt(0);
            updatedData[rowIndex][colIndex] = { expr, value };
          }
        });

        setSpreadsheetData(updatedData);
      }
    };

    loadSpreadsheet();
  }, [ws, ssName]);

  const handleCellFocus = (id: string) => {
    setFocusedCellId(id);
  };

  const handleCellBlur = async (id: string, newValue: string) => {
    const [col, row] = id.match(/[A-Za-z]+|\d+/g) || [];
    if (col && row) {
      const rowIndex = parseInt(row) - 1;
      const colIndex = col.charCodeAt(0) - 'A'.charCodeAt(0);

      const updatesResult =
        newValue.length > 0
          ? await ws.evaluate(ssName, id, newValue)
          : await ws.remove(ssName, id);

      if (updatesResult.isOk) {
        const updatedData = Array.from(spreadsheetData);
        updatedData[rowIndex][colIndex] = {
          expr: newValue,
          value: updatesResult.val[id],
        };
        setSpreadsheetData(updatedData);
      } else {
        // Handle errors here
      }
    }
  };

  const clearSpreadsheet = async () => {
    const clearResult = await ws.clear(ssName);
    if (clearResult.isOk) {
      const updatedData: CellData[][] = new Array(N_ROWS).fill(null).map(() =>
        new Array(N_COLS).fill({ expr: '', value: 0 })
      );
      setSpreadsheetData(updatedData);
    } else {
      // Handle errors here
    }
  };

  return (
    <div id="ss">
      <table>
        <thead>
          <tr>
            <th></th>
            {Array.from({ length: N_COLS }, (_, i) => (
              <th key={i}>{String.fromCharCode('A'.charCodeAt(0) + i)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spreadsheetData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th>{rowIndex + 1}</th>
              {row.map((cell, colIndex) => (
                <Cell
                  key={colIndex}
                  data={cell}
                  id={`${String.fromCharCode(
                    'A'.charCodeAt(0) + colIndex
                  )}${rowIndex + 1}`}
                  onFocus={handleCellFocus}
                  onBlur={handleCellBlur}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button id="clear" type="button" onClick={clearSpreadsheet}>
        Clear
      </button>
    </div>
  );
};

export default Spreadsheet;
