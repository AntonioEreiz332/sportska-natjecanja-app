import React, { useState, useEffect } from 'react';
import axios from 'axios';
import IgracItem from './IgracItem';
import IgracForm from './IgracForm';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/tim`;

function IgracList() {
  const [igraci, setIgraci] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [igracZaUredjivanje, setIgracZaUredjivanje] = useState(null);
  const [prikaziFormu, setPrikaziFormu] = useState(false);

  const fetchIgraci = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setIgraci(response.data.igraci || []);
      setError(null);
    } catch (err) {
      setError('Greška pri dohvaćanju igrača: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIgraci();
  }, []);

  const handleAdd = async (igracData) => {
    try {
      const response = await axios.post(API_URL, igracData);

      if (response.data.ok) {
        alert('Igrač uspješno dodan!');
        fetchIgraci();
        setPrikaziFormu(false);
      }
    } catch (err) {
      alert('Greška: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleUpdate = async (igracData) => {
    try {
      // id koristimo iz igracZaUredjivanje, ne šaljemo u body
      const response = await axios.put(
        `${API_URL}/${encodeURIComponent(igracZaUredjivanje.id)}`,
        igracData
      );

      if (response.data.ok) {
        alert('Igrač uspješno ažuriran!');
        fetchIgraci();
        setIgracZaUredjivanje(null);
        setPrikaziFormu(false);
      }
    } catch (err) {
      alert('Greška: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Jesi li siguran da želiš obrisati ovog igrača?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_URL}/${encodeURIComponent(id)}`
      );

      if (response.data.ok) {
        alert('Igrač uspješno obrisan!');
        fetchIgraci();
      }
    } catch (err) {
      alert('Greška: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleEditClick = (igrac) => {
    setIgracZaUredjivanje(igrac);
    setPrikaziFormu(true);
  };

  const handleCancel = () => {
    setIgracZaUredjivanje(null);
    setPrikaziFormu(false);
  };

  if (loading) {
    return <div className="loading">Učitavanje igrača...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={fetchIgraci}>Pokušaj ponovo</button>
      </div>
    );
  }

  return (
    <div className="tim-list-container">
      <div className="header">
        <h1>Upravljanje Igračima</h1>
        {!prikaziFormu && (
          <button
            onClick={() => setPrikaziFormu(true)}
            className="btn-add-new"
          >
            Dodaj Novog Igrača
          </button>
        )}
      </div>

      {prikaziFormu && (
        <IgracForm
          igracZaUredjivanje={igracZaUredjivanje}
          onSubmit={igracZaUredjivanje ? handleUpdate : handleAdd}
          onCancel={handleCancel}
        />
      )}

      <div className="timovi-table-wrapper">
        <h2>Popis Igrača ({igraci.length})</h2>

        {igraci.length === 0 ? (
          <p className="no-data">Nema igrača u bazi podataka.</p>
        ) : (
          <table className="timovi-table">
            <thead>
              <tr>
                <th>Ime</th>
                <th>Prezime</th>
                <th>Pozicija</th>
                <th>Broj</th>
                <th>Nacionalnost</th>
                <th>Datum rođenja</th>
                <th>Tim</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {igraci.map((igrac) => (
                <IgracItem
                  key={igrac.id}
                  igrac={igrac}
                  onEdit={handleEditClick}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default IgracList;
