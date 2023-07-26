import SpreadsheetWs from './ss-ws.js';

import { Result, okResult, errResult } from 'cs544-js-utils';

import { Errors, makeElement } from './utils.js';

const [N_ROWS, N_COLS] = [10, 10];

export default async function make(ws: SpreadsheetWs, ssName: string) {
  return await Spreadsheet.make(ws, ssName);
}


class Spreadsheet {

  private readonly ws: SpreadsheetWs;
  private readonly ssName: string;
  private readonly errors: Errors;
  //TODO: add more instance variables

  private previousErrors: string[] = [];

  private focusedCellId: string | null = null;
  private copySourceCellId: string | null = null;
  private copySourceExpr: string | null = null;
  
  
  constructor(ws: SpreadsheetWs, ssName: string) {
    this.ws = ws; this.ssName = ssName;
    this.errors = new Errors();
    this.makeEmptySS();
    this.addListeners();
    //TODO: initialize added instance variables

    this.load();


  }

  static async make(ws: SpreadsheetWs, ssName: string) {
    const ss = new Spreadsheet(ws, ssName);
    await ss.load();
    return ss;
  }

  /** add listeners for different events on table elements */
  private addListeners() {
    const clearButton = document.querySelector('#clear');
    if(clearButton) {
      clearButton.addEventListener('click', this.clearSpreadsheet);
    }

    //TODO: add listeners for #clear and .cell
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
    cell.addEventListener('focus', this.focusCell);
    cell.addEventListener('blur', this.blurCell);
    cell.addEventListener('copy', this.copyCell);
    cell.addEventListener('paste', this.pasteCell);
  });
  }

 

private async load() {
   /** load initial spreadsheet data into DOM */
    const result = await this.ws.dump(this.ssName);
    if (result.isOk) {
      const cells = document.querySelectorAll('.cell');
      cells.forEach(cell => {
        cell.textContent = '';
        cell.removeAttribute('data-value');
        cell.removeAttribute('data-expr');
      });
      result.val.forEach(([cellId, expr]) => {
        const cell = document.querySelector(`#${cellId}`);
        if (cell) {
          cell.setAttribute('data-expr', expr);
          cell.textContent = expr;
        }
      });
    } else {
      // this.errors.display(result.errors);
      this.clearPreviousErrors();
      this.errors.display(result.errors);
      // Store the new errors as previous errors
      this.previousErrors = result.errors.map(err => err.toString());


    }
} 

private clearPreviousErrors() {
  this.previousErrors = [];
}

  /** listener for a click event on #clear button */
  private readonly clearSpreadsheet = async (ev: Event) => {
    ev.preventDefault();
    const result = await this.ws.clear(this.ssName);
    if (result.isOk) {
      const cells = document.querySelectorAll('.cell');
      cells.forEach(cell => {
        cell.textContent = '';
        cell.removeAttribute('data-value');
        cell.removeAttribute('data-expr');
      });
    } else {
      this.errors.display(result.errors);
    }
  };
  

 private readonly focusCell = (ev: Event) => {
  const cell = ev.target as HTMLElement;
  this.focusedCellId = cell.id;
  cell.textContent = cell.getAttribute('data-expr') || '';
};
  
private readonly blurCell = async (ev: Event) => {
  const cell = ev.target as HTMLElement;
  const expr = cell.textContent?.trim() || '';
  cell.setAttribute('data-expr', expr);
  this.focusedCellId = null;

  // Clear previously displayed errors
  this.errors.clear();

  let result: Result<{ [cellId: string]: number }>;
  if (expr === '') {
    result = await this.ws.remove(this.ssName, cell.id);
  } else {
    result = await this.ws.evaluate(this.ssName, cell.id, expr);
  }

  if (result.isOk) {
    // Clear errors again after a successful fetch response
    this.errors.clear();

    Object.entries(result.val).forEach(([cellId, value]) => {
      if (cellId !== this.focusedCellId) {
        const cell = document.querySelector(`#${cellId}`);
        if (cell) {
          cell.setAttribute('data-value', value.toString());
          cell.textContent = value.toString();
        }
      }
    });
  } else {
    this.errors.display(result.errors);
  }
};


   private copyCell = (ev: Event) => {
    const cell = ev.target as HTMLElement;
    this.copySourceCellId = cell.id;
    this.copySourceExpr = cell.getAttribute('data-expr') || '';
    cell.classList.add('is-copy-source');
  };

  // private pasteCell = (ev: ClipboardEvent) => {
  //   const cell = ev.target as HTMLElement;
  //   const destCellId = cell.id;
  //   const srcCellId = this.copySourceCellId;
  //   const srcExpr = this.copySourceExpr;
  
  //   if (srcCellId && srcExpr) {
  //     const copySourceCell = document.querySelector(`#${srcCellId}`);
  //     if (copySourceCell) {
  //       const srcDataExpr = copySourceCell.getAttribute('data-expr');
  //       const srcDataValue = copySourceCell.getAttribute('data-value');
  
  //       if (srcDataExpr !== null && srcDataValue !== null) {
  //         // Copy data-expr and data-value attributes from the source cell
  //         cell.setAttribute('data-expr', srcDataExpr);
  //         cell.setAttribute('data-value', srcDataValue);
  
  //         // Get destination cell coordinates (row and column) from the cell id
  //         const [destCol, destRow] = this.getCellCoordinates(destCellId);
  
  //         // Get source cell coordinates (row and column) from the cell id
  //         const [srcCol, srcRow] = this.getCellCoordinates(srcCellId);
  
  //         // Calculate the offset between the source and destination rows and columns
  //         const colOffset = destCol.charCodeAt(0) - srcCol.charCodeAt(0);
  //         const rowOffset = Number(destRow) - Number(srcRow);
  
  //         // Replace cell references in the expression with updated coordinates
  //         // Replace cell references in the expression with updated coordinates
  //       const updatedExpr = srcDataExpr.replace(/(\$?[a-zA-Z]+)(\$?\d+)/g, (match, p1, p2) => {
  //         const col = p1.replace('$', '');
  //         const row = p2.replace('$', '');
  //         const updatedCol = p1.includes('$') ? col : String.fromCharCode(col.charCodeAt(0) + colOffset);
  //         const updatedRow = p2.includes('$') ? row : (Number(row) + rowOffset).toString();
  //         return updatedCol + updatedRow;
  //       });

  
  //         cell.textContent = updatedExpr;
  //       }
  //     }
  //   }
  
  //   this.copySourceCellId = null;
  //   this.copySourceExpr = null;
  //   const copySourceCell = document.querySelector(`#${srcCellId}`);
  //   if (copySourceCell) {
  //     copySourceCell.classList.remove('is-copy-source');
  //   }
  //   ev.preventDefault();
  // };
  
  // private getCellCoordinates(cellId: string): [string, string] {
  //   const col = cellId.match(/[a-zA-Z]+/)?.[0] || '';
  //   const row = cellId.match(/\d+/)?.[0] || '';
  //   return [col, row];
  // }

  private pasteCell = (ev: ClipboardEvent) => {
    const cell = ev.target as HTMLElement;
    const destCellId = cell.id;
    const srcCellId = this.copySourceCellId;
    const srcExpr = this.copySourceExpr;
  
    if (srcCellId && srcExpr) {
      const copySourceCell = document.querySelector(`#${srcCellId}`);
      if (copySourceCell) {
        const srcDataExpr = copySourceCell.getAttribute('data-expr');
        const srcDataValue = copySourceCell.getAttribute('data-value');
  
        if (srcDataExpr !== null && srcDataValue !== null) {
          // Copy data-expr and data-value attributes from the source cell
          cell.setAttribute('data-expr', srcDataExpr);
          cell.setAttribute('data-value', srcDataValue);
  
          // Get destination cell coordinates (row and column) from the cell id
          const [destCol, destRow] = this.getCellCoordinates(destCellId);
  
          // Get source cell coordinates (row and column) from the cell id
          const [srcCol, srcRow] = this.getCellCoordinates(srcCellId);
  
          // Calculate the offset between the source and destination rows and columns
          const colOffset = destCol.charCodeAt(0) - srcCol.charCodeAt(0);
          const rowOffset = Number(destRow) - Number(srcRow);
  
          // Replace cell references in the expression with updated coordinates
          const updatedExpr = srcDataExpr.replace(/(\$?[a-zA-Z]+)(\$?\d+)/g, (match, p1, p2) => {
            const col = p1.replace('$', '');
            const row = p2.replace('$', '');
            const updatedCol = p1.includes('$') ? `$${col}` : String.fromCharCode(col.charCodeAt(0) + colOffset);
            const updatedRow = p2.includes('$') ? `$${row}` : (Number(row) + rowOffset).toString();
            return updatedCol + updatedRow;
          });
  
          cell.textContent = updatedExpr;
        }
      }
    }
  
    this.copySourceCellId = null;
    this.copySourceExpr = null;
    const copySourceCell = document.querySelector(`#${srcCellId}`);
    if (copySourceCell) {
      copySourceCell.classList.remove('is-copy-source');
    }
    ev.preventDefault();
  };
  
  private getCellCoordinates(cellId: string): [string, string] {
    const col = cellId.match(/[a-zA-Z]+/)?.[0] || '';
    const row = cellId.match(/\d+/)?.[0] || '';
    return [col, row];
  }
    
  private makeEmptySS() {
    const ssDiv = document.querySelector('#ss')!;
    ssDiv.innerHTML = '';
    const ssTable = makeElement('table');
    const header = makeElement('tr');
    const clearCell = makeElement('td');
    const clear = makeElement('button', {id: 'clear', type: 'button'}, 'Clear');
    clearCell.append(clear);
    header.append(clearCell);
    const A = 'A'.charCodeAt(0);
    for (let i = 0; i < N_COLS; i++) {
      header.append(makeElement('th', {}, String.fromCharCode(A + i)));
    }
    ssTable.append(header);
    for (let i = 0; i < N_ROWS; i++) {
      const row = makeElement('tr');
      row.append(makeElement('th', {}, (i + 1).toString()));
      const a = 'a'.charCodeAt(0);
      for (let j = 0; j < N_COLS; j++) {
	const colId = String.fromCharCode(a + j);
	const id = colId + (i + 1);
	const cell =
	  makeElement('td', {id, class: 'cell', contentEditable: 'true'});
	row.append(cell);
      }
      ssTable.append(row);
    }
    ssDiv.append(ssTable);
  }

}