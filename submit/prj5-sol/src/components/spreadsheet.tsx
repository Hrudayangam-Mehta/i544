import React, { useEffect, useState } from 'react';
import SpreadsheetWs from '../lib/ss-ws.js';
import { Result, okResult, errResult } from 'cs544-js-utils';
import { Errors, makeElement } from '../lib/utils.js';

const [N_ROWS, N_COLS] = [10, 10];

export default async function make(ws: SpreadsheetWs, ssName: string) {
  return await Spreadsheet.make(ws, ssName);
}

class Spreadsheet {
  private readonly ws: SpreadsheetWs;
  private readonly ssName: string;
  private readonly errors: Errors;
  private focusedCellId: string;
  private copySrcCellId?: string;

  constructor(ws: SpreadsheetWs, ssName: string) {
    this.ws = ws;
    this.ssName = ssName;
    this.errors = new Errors();
    this.focusedCellId = '';
    this.makeEmptySS();
    this.addListeners();
  }

  static async make(ws: SpreadsheetWs, ssName: string) {
    const ss = new Spreadsheet(ws, ssName);
    await ss.load();
    return ss;
  }

  private addListeners() {
    const clear = document.querySelector('#clear')!;
    clear.addEventListener('click', this.clearSpreadsheet);
    document.querySelectorAll('.cell').forEach(cell => {
      cell.addEventListener('focusin', this.focusCell);
      cell.addEventListener('focusout', this.blurCell);
      cell.addEventListener('copy', this.copyCell);
      cell.addEventListener('paste', this.pasteCell);
    });
  }

  private readonly clearSpreadsheet = async (ev: Event) => {
    ev.stopPropagation();
    ev.preventDefault();
    const clearResult = await this.ws.clear(this.ssName);
    if (clearResult.isOk) {
      this.errors.clear();
      document.querySelectorAll('.cell').forEach(c => {
        c.setAttribute('data-value', '');
        c.setAttribute('data-expr', '');
        c.textContent = '';
      });
    } else {
      this.errors.display(clearResult.errors);
    }
  };

  private readonly focusCell = (ev: Event) => {
    ev.stopPropagation();
    const target = ev.target! as HTMLElement;
    target.textContent = target.getAttribute('data-expr');
    this.focusedCellId = target.id;
  };

  private readonly blurCell = async (ev: Event) => {
    ev.stopPropagation();
    const target = ev.target! as HTMLElement;
    const cellId = target.id;
    const expr = target.textContent!.trim();
    const updatesResult =
      expr.length > 0
        ? await this.ws.evaluate(this.ssName, cellId, expr)
        : await this.ws.remove(this.ssName, cellId);
    if (updatesResult.isOk) {
      this.errors.clear();
      target.setAttribute('data-expr', expr);
      this.update(updatesResult.val);
    } else {
      target.textContent = target.getAttribute('data-value');
      this.errors.display(updatesResult.errors);
    }
    this.focusedCellId = '';
  };

  private readonly copyCell = (ev: Event) => {
    ev.stopPropagation();
    ev.preventDefault();
    const target = ev.target! as HTMLElement;
    target.classList.add('is-copy-source');
    this.copySrcCellId = target.id;
  };

  private readonly pasteCell = async (ev: Event) => {
    ev.stopPropagation();
    ev.preventDefault();
    if (!this.copySrcCellId) return;
    const srcCellId = this.copySrcCellId;
    this.copySrcCellId = undefined;
    const target = ev.target! as HTMLElement;
    const destCellId = target.id;
    const updatesResult = await this.ws.copy(this.ssName, destCellId, srcCellId);
    const queryResult = await this.ws.query(this.ssName, destCellId);
    if (updatesResult.isOk && queryResult.isOk) {
      this.errors.clear();
      this.update(updatesResult.val);
      target.setAttribute('data-expr', queryResult.val.expr);
      target.textContent = target.getAttribute('data-expr');
      document.querySelector(`#${srcCellId}`)!.classList.remove('is-copy-source');
    } else if (!updatesResult.isOk) {
      this.errors.display(updatesResult.errors);
    } else if (!queryResult.isOk) {
      this.errors.display(queryResult.errors);
    }
  };

  private async load() {
    const loadResult = await this.ws.dumpWithValues(this.ssName);
    if (!loadResult.isOk) {
      this.errors.display(loadResult.errors);
    } else {
      this.errors.clear();
      loadResult.val.forEach(([cellId, expr, value]) => {
        const cell = document.querySelector(`#${cellId}`)!;
        cell.setAttribute('data-expr', expr);
        const val = value.toString();
        cell.setAttribute('data-value', val);
        cell.textContent = val;
      });
    }
  }

  private update(updates: Record<string, number>) {
    for (const [cellId, value] of Object.entries(updates)) {
      if (cellId !== this.focusedCellId) {
        const cell = document.querySelector(`#${cellId}`)!;
        const val = value.toString();
        cell.textContent = val;
        cell.setAttribute('data-value', val);
      }
    }
  }

  private makeEmptySS() {
    const ssDiv = document.querySelector('#ss')!;
    ssDiv.innerHTML = '';
    const ssTable = makeElement('table');
    const header = makeElement('tr');
    const clearCell = makeElement('td');
    const clear = makeElement('button', { id: 'clear', type: 'button' }, 'Clear');
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
        const cell = makeElement('td', { id, class: 'cell', contentEditable: 'true' });
        row.append(cell);
      }
      ssTable.append(row);
    }
    ssDiv.append(ssTable);
  }
}
