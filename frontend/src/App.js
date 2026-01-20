import React, { useState } from 'react';
import TimList from './components/TimList';
import IgracList from './components/IgracList';
import UtakmicaList from './components/UtakmicaList';
import LigaList from './components/LigaList';
import SezonaList from './components/SezonaList';
import './App.css';

function App() {
  const [page, setPage] = useState('timovi');

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sustav za Praćenje Sportskih Natjecanja</h1>
        <p>Tim B</p>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn-submit"
            type="button"
            onClick={() => setPage("timovi")}
            style={{ flex: "unset", opacity: page === "timovi" ? 1 : 0.85 }}
          >
            Timovi
          </button>

          <button
            className="btn-submit"
            type="button"
            onClick={() => setPage("igraci")}
            style={{ flex: "unset", opacity: page === "igraci" ? 1 : 0.85 }}
          >
            Igrači
          </button>

          <button
            className="btn-submit"
            type="button"
            onClick={() => setPage("utakmice")}
            style={{ flex: "unset", opacity: page === "utakmice" ? 1 : 0.85 }}
          >
            Utakmica
          </button>

          <button
            className="btn-submit"
            type="button"
            onClick={() => setPage("lige")}
            style={{ flex: "unset", opacity: page === "lige" ? 1 : 0.85 }}
          >
            Lige
          </button>

          <button
            className="btn-submit"
            type="button"
            onClick={() => setPage("sezone")}
            style={{ flex: "unset", opacity: page === "sezone" ? 1 : 0.85 }}
          >
            Sezone
          </button>
        </div>
      </header>

      <main>
        {page === "timovi" && <TimList />}
        {page === "igraci" && <IgracList />}
        {page === "utakmice" && <UtakmicaList />}
        {page === "lige" && <LigaList />}
        {page === 'sezone' && <SezonaList />}
      </main>

      <footer>
        <p>Projekt iz kolegija: Nerelacijske i distribuirane baze podataka</p>
      </footer>
    </div>
  );
}

export default App;
