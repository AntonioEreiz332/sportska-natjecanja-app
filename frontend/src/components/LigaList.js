import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LigaItem from './LigaItem';
import LigaForm from './LigaForm';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/tim`;


function LigaList() {
  const [lige, setLige] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ligaZaUredjivanje, setLigaZaUredjivanje] = useState(null);
  const [prikaziFormu, setPrikaziFormu] = useState(false);

  const fetchLige = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setLige(response.data.lige || []);
      setError(null);
    } catch (err) {
      setError('Greška pri dohvaćanju liga: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLige();
  }, []);

  const handleAdd = async (ligaData) => {
    try {
      const response = await axios.post(API_URL, ligaData);

      if (response.data.ok) {
        alert('Liga uspješno dodana!');
        fetchLige();
        setPrikaziFormu(false);
      }
    } catch (err) {
      alert('Greška: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleUpdate = async (ligaData) => {
    try {
      const response = await axios.put(
        `${API_URL}/${encodeURIComponent(ligaZaUredjivanje.id)}`,
        ligaData
      );

      if (response.data.ok) {
        alert('Liga uspješno ažurirana!');
        fetchLige();
        setLigaZaUredjivanje(null);
        setPrikaziFormu(false);
      }
    } catch (err) {
      alert('Greška: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Jesi li siguran da želiš obrisati ovu ligu?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_URL}/${encodeURIComponent(id)}`
      );

      if (response.data.ok) {
        alert('Liga uspješno obrisana!');
        fetchLige();
      }
    } catch (err) {
      alert('Greška: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleEditClick = (liga) => {
    setLigaZaUredjivanje(liga);
    setPrikaziFormu(true);
  };

  const handleCancel = () => {
    setLigaZaUredjivanje(null);
    setPrikaziFormu(false);
  };

  if (loading) {
    return <div className="loading">Učitavanje liga...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={fetchLige}>Pokušaj ponovo</button>
      </div>
    );
  }

  return (
    <div className="tim-list-container">
      <div className="header">
        <h1>Upravljanje Ligama</h1>
        {!prikaziFormu && (
          <button onClick={() => setPrikaziFormu(true)} className="btn-add-new">
            Dodaj Novu Ligu
          </button>
        )}
      </div>

      {prikaziFormu && (
        <LigaForm
          ligaZaUredjivanje={ligaZaUredjivanje}
          onSubmit={ligaZaUredjivanje ? handleUpdate : handleAdd}
          onCancel={handleCancel}
        />
      )}

      <div className="timovi-table-wrapper">
        <h2>Popis Liga ({lige.length})</h2>

        {lige.length === 0 ? (
          <p className="no-data">Nema liga u bazi podataka.</p>
        ) : (
          <table className="timovi-table">
            <thead>
              <tr>
                <th>Naziv</th>
                <th>Država</th>
                <th>Razina</th>
                <th>God. osnivanja</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {lige.map((liga) => (
                <LigaItem
                  key={liga.id}
                  liga={liga}
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

export default LigaList;
