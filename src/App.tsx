import React, {ChangeEvent, useState} from 'react';
import './App.scss';
import {Share} from "./Share";

/*
TODO:
- server
  - check links that aren't working
- client
  - receive shares (https://www.chromestatus.com/feature/5662315307335680)
    - API doesn't work on Fairphone - does work on smth else
  - optimize for copy/pasting
  - start download after pasting, use share afterwards (same usability)
 */

interface State {
  url: string,
  downloadedFile: File|null,
  error: string|null
}

export default function App() {
  const [state, setState] = useState<State>({
    url: "",
    downloadedFile: null,
    error: null
  });
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: ChangeEvent<HTMLFormElement>) {
    const downloadedFile = state.downloadedFile;
    setState({...state, error: null, downloadedFile: null});
    const share = new Share();
    if(downloadedFile !== null) {
      share.processFile(downloadedFile)
        .then(shareResponse => {
          if(shareResponse.shareError === null) {
            return;
          }
          setState({...state, error: shareResponse.shareError});
        });
      return;
    }
    setLoading(true);
    share.share(state.url)
      .then(shareResponse => {
        // for longer videos the download promise doesn't count as a "user gesture" anymore
        // and a "DOMException: Failed to execute 'share' on 'Navigator': Must be handling a user gesture to perform a share request."
        // is thrown, therefore we need a new click and share the file directly
        if(shareResponse.shareError === null) {
          return;
        }
        setState({...state, downloadedFile: shareResponse.file});
      })
      .catch(error => {
        console.error("An error has occured during submitting", error);
        let msg = error;
        if(error.message) {
          msg = error.message;
        }
        setState({...state, error: msg});
      })
      .finally(() => {
        setLoading(false);
      });
    event.preventDefault();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setState({...state, url: event.target.value, downloadedFile: null})
  }

  return (
    <div className="App">
      <div className="brand">
        <img src="logo.png" alt="Logo" />loadR
      </div>
      {state.error && <div className="error">{state.error}</div>}
      <form onSubmit={handleSubmit}>
        <input type="text" value={state.url} onChange={handleChange}/>
        <button>{loading ? "Loading..." : (state.downloadedFile === null ? "Download & Share" : "Share")}</button>
      </form>
    </div>
  );
}
