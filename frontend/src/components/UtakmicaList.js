import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UtakmicaItem from './UtakmicaItem';
import UtakmicaForm from './UtakmicaForm';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/tim`;

function UtakmicaList() {
  const [utakmice, setUtakmice] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [utakmicaZaUredjivanje, setUtakmicaZaUredjivanje] = useState(null);
  const [prikaziFormu, setPrikaziFormu] = useState(false);

  const fetchUtakmice = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setUtakmice(response.data.utakmice || []);
      setError(null);
    } catch (err) {
      setError('Greška pri dohvaćanju utakmica: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUtakmice();
  }, []);

  const handleAdd = async (data) => {
    try {
      const response = await axios.post(API_URL, data);

      if (response.data.ok) {
        alert('Utakmica uspješno dodana!');
        fetchUtakmice();
        setPrikaziFormu(false);
      }
    } catch (err) {
      alert('Greška: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleUpdate = async (data) => {
    try {
      const response = await axios.put(
        `${API_URL}/${encodeURIComponent(utakmicaZaUredjivanje.id)}`,
        data
      );

      if (response.data.ok) {
        alert('Utakmica uspješno ažurirana!');
        fetchUtakmice();
        setUtakmicaZaUredjivanje(null);
        setPrikaziFormu(false);
      }
    } catch (err) {
      alert('Greška: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Jesi li siguran da želiš obrisati ovu utakmicu?')) return;

    try {
      const response = await axios.delete(`${API_URL}/${encodeURIComponent(id)}`);

      if (response.data.ok) {
        alert('Utakmica uspješno obrisana!');
        fetchUtakmice();
      }
    } catch (err) {
      alert('Greška: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleEditClick = (u) => {
    setUtakmicaZaUredjivanje(u);
    setPrikaziFormu(true);
  };

  const handleCancel = () => {
    setUtakmicaZaUredjivanje(null);
    setPrikaziFormu(false);
  };

  if (loading) return <div className="loading">Učitavanje utakmica...</div>;

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={fetchUtakmice}>Pokušaj ponovo</button>
      </div>
    );
  }

  return (
    <div className="tim-list-container">
      <div className="header">
        <h1>Upravljanje Utakmicama</h1>
        {!prikaziFormu && (
          <button onClick={() => setPrikaziFormu(true)} className="btn-add-new">
            Dodaj Novu Utakmicu
          </button>
        )}
      </div>

      {prikaziFormu && (
        <UtakmicaForm
          utakmicaZaUredjivanje={utakmicaZaUredjivanje}
          onSubmit={utakmicaZaUredjivanje ? handleUpdate : handleAdd}
          onCancel={handleCancel}
        />
      )}

      <div className="timovi-table-wrapper">
        <h2>Popis Utakmica ({utakmice.length})</h2>

        {utakmice.length === 0 ? (
          <p className="no-data">Nema utakmica u bazi podataka.</p>
        ) : (
          <table className="timovi-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Kolo</th>
                <th>Stadion</th>
                <th>Domaćin</th>
                <th>Gost</th>
                <th>Broj gledatelja</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {utakmice.map(u => (
                <UtakmicaItem
                  key={u.id}
                  utakmica={u}
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

export default UtakmicaList;
