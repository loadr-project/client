import React, {ChangeEvent, useState, useEffect} from 'react';
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
  // @ts-ignore
  const parsedUrl = new URL(window.location);
  const sharedTitle = parsedUrl.searchParams.get('title');
  const sharedText = parsedUrl.searchParams.get('text');
  const sharedUrl = parsedUrl.searchParams.get('url');

  const urlToShare: string | null = sharedUrl ?? sharedText;

  const [state, setState] = useState<State>({
    url: "",
    downloadedFile: null,
    error: null
  });
  const [loading, setLoading] = useState(false);

  const share = new Share();

  useEffect(() => {
    if (urlToShare !== null) {
      setState({...state, url: urlToShare});
      downloadFile(urlToShare);
    }
  }, []);


  function downloadFile(url: string) {
    setLoading(true);
    share.share(url)
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
  }

  function handleSubmit(event: ChangeEvent<HTMLFormElement>) {
    const downloadedFile = state.downloadedFile;
    setState({...state, error: null, downloadedFile: null});
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
    downloadFile(state.url);
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
      {sharedTitle &&
      <div>
        title: {sharedTitle}
      </div>
      }
      {sharedText &&
      <div>
        text: {sharedText}
      </div>
      }
      {sharedUrl &&
      <div>
        url: {sharedUrl}
      </div>
      }
    </div>
  );
}
