import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SezonaItem from './SezonaItem';
import SezonaForm from './SezonaForm';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/tim`;

function SezonaList() {
  const [sezone, setSezone] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sezonaZaUredjivanje, setSezonaZaUredjivanje] = useState(null);
  const [prikaziFormu, setPrikaziFormu] = useState(false);

  const fetchSezone = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setSezone(response.data.sezone || []);
      setError(null);
    } catch (err) {
      setError('Greška pri dohvaćanju sezona: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSezone();
  }, []);

  const handleAdd = async (data) => {
    try {
      const response = await axios.post(API_URL, data);

      if (response.data.ok) {
        alert('Sezona uspješno dodana!');
        fetchSezone();
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
        `${API_URL}/${encodeURIComponent(sezonaZaUredjivanje.id)}`,
        data
      );

      if (response.data.ok) {
        alert('Sezona uspješno ažurirana!');
        fetchSezone();
        setSezonaZaUredjivanje(null);
        setPrikaziFormu(false);
      }
    } catch (err) {
      alert('Greška: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Jesi li siguran da želiš obrisati ovu sezonu?')) return;

    try {
      const response = await axios.delete(`${API_URL}/${encodeURIComponent(id)}`);

      if (response.data.ok) {
        alert('Sezona uspješno obrisana!');
        fetchSezone();
      }
    } catch (err) {
      alert('Greška: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleEditClick = (s) => {
    setSezonaZaUredjivanje(s);
    setPrikaziFormu(true);
  };

  const handleCancel = () => {
    setSezonaZaUredjivanje(null);
    setPrikaziFormu(false);
  };

  if (loading) return <div className="loading">Učitavanje sezona...</div>;

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={fetchSezone}>Pokušaj ponovo</button>
      </div>
    );
  }

  return (
    <div className="tim-list-container">
      <div className="header">
        <h1>Upravljanje Sezonama</h1>
        {!prikaziFormu && (
          <button onClick={() => setPrikaziFormu(true)} className="btn-add-new">
            Dodaj Novu Sezonu
          </button>
        )}
      </div>

      {prikaziFormu && (
        <SezonaForm
          sezonaZaUredjivanje={sezonaZaUredjivanje}
          onSubmit={sezonaZaUredjivanje ? handleUpdate : handleAdd}
          onCancel={handleCancel}
        />
      )}

      <div className="timovi-table-wrapper">
        <h2>Popis Sezona ({sezone.length})</h2>

        {sezone.length === 0 ? (
          <p className="no-data">Nema sezona u bazi podataka.</p>
        ) : (
          <table className="timovi-table">
            <thead>
              <tr>
                <th>Naziv</th>
                <th>Broj kola</th>
                <th>Početak</th>
                <th>Kraj</th>
                <th>Liga</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {sezone.map(s => (
                <SezonaItem
                  key={s.id}
                  sezona={s}
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

export default SezonaList;
