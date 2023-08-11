import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import Spreadsheet from './spreadsheet';
import SpreadsheetWs from '../lib/ss-ws';
import { makeElement } from '../lib/utils';
// import React from 'react';
// import ReactDOM from 'react-dom';
// import Spreadsheet from './spreadsheet';
// import SpreadsheetWs from '../lib/ss-ws';

const WS_URL = 'https://zdu.binghamton.edu:2345'; // Update with the correct URL

export const App: React.FC = () => {
  const [ws, setWs] = useState<SpreadsheetWs | null>(null); // Use state to store ws
  const [ssName, setSsName] = useState<string>(''); // Use state to store ssName

  // Define a function to handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const wsUrlInput = document.querySelector('#ws-url') as HTMLInputElement;
    const ssNameInput = document.querySelector('#ss-name') as HTMLInputElement;
    const wsUrl = wsUrlInput.value.trim();
    const ssName = ssNameInput.value.trim();
    if (wsUrl.length === 0 || ssName.length === 0) {
      alert('Both the Web Services Url and Spreadsheet Name must be specified');
    } else {
      setWs(SpreadsheetWs.make(wsUrl)); // Set ws state
      setSsName(ssName); // Set ssName state
    }
  };

  // Define a function to render the form
  const renderForm = () => {
    return (
      <form className="form" id="ss-form" onSubmit={handleSubmit}>
        <label htmlFor="ws-url">Web Services Url</label>
        <input name="ws-url" id="ws-url" defaultValue={WS_URL} />
        <label htmlFor="ss-name">Spreadsheet Name</label>
        <input name="ss-name" id="ss-name" />
        <label></label>
        <button type="submit">Load Spreadsheet</button>
      </form>
    );
  };

  // Define a function to render the spreadsheet
  const renderSpreadsheet = () => {
    return <Spreadsheet ws={ws!} ssName={ssName} />;
  };

  return (
    <div id="app">
      {ws ? renderSpreadsheet() : renderForm()} 
    </div>
  );
};

const rootElement = document.getElementById('app'); // Change 'root' to 'app'
// ReactDOM.createRoot(rootElement).render(<App />); // Use createRoot instead of render
ReactDOM.render(<App />, rootElement); // Use createRoot instead of render
