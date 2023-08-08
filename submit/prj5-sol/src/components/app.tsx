import React, { useState } from 'react';
import { Errors, makeElement } from '../lib/utils.js'; // Update the import path if needed
import SpreadsheetWs from '../lib/ss-ws'; // Update the import path if needed
import makeSpreadsheet from '../lib/spreadsheet.js'; // Update the import path if needed


export default function App() {
  const [wsUrl, setWsUrl] = useState('');
  const [ssName, setSsName] = useState('');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  
  async function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessages([]);

    if (wsUrl.trim().length === 0 || ssName.trim().length === 0) {
      setErrorMessages(['Both the Web Services Url and Spreadsheet Name must be specified']);
    } else {
      const ws = SpreadsheetWs.make(wsUrl);
      await makeSpreadsheet(ws, ssName);
    }
  }

  return (
    <div id="app">
      <form className="form" id="ss-form" onSubmit={handleFormSubmit}>
        <label htmlFor="ws-url">Web Services Url</label>
        <input
          name="ws-url"
          id="ws-url"
          value={wsUrl}
          onChange={(event) => setWsUrl(event.target.value)}
        />

        <label htmlFor="ss-name">Spreadsheet Name</label>
        <input
          name="ss-name"
          id="ss-name"
          value={ssName}
          onChange={(event) => setSsName(event.target.value)}
        />

        <label></label>
        <button type="submit">Load Spreadsheet</button>
      </form>

      <ul className="error" id="errors">
        {errorMessages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>

      <div id="ss"></div>
    </div>
  );
}
