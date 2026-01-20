import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimItem from './TimItem';
import TimForm from './TimForm';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/tim`;

function TimList() {
  const [timovi, setTimovi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timZaUredjivanje, setTimZaUredjivanje] = useState(null);
  const [prikaziFormu, setPrikaziFormu] = useState(false);

  const fetchTimovi = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setTimovi(response.data.timovi || []);
      setError(null);
    } catch (err) {
      setError('Greška pri dohvaćanju timova: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimovi();
  }, []);

  const handleAdd = async (timData) => {
    try {
      const response = await axios.post(API_URL, timData);
      
      if (response.data.ok) {
        alert('Tim uspješno dodan!');
        fetchTimovi();
        setPrikaziFormu(false);
      }
    } catch (err) {
      alert('Greška: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleUpdate = async (timData) => {
    try {
      const { naziv, ...ostaliPodaci } = timData;
      
      const response = await axios.put(
        `${API_URL}/${encodeURIComponent(timZaUredjivanje.naziv)}`,
        ostaliPodaci
      );
      
      if (response.data.ok) {
        alert('Tim uspješno ažuriran!');
        fetchTimovi();
        setTimZaUredjivanje(null);
        setPrikaziFormu(false);
      }
    } catch (err) {
      alert('Greška: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleDelete = async (naziv) => {
    if (!window.confirm(`Jesi li siguran da želiš obrisati tim "${naziv}"?`)) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_URL}/${encodeURIComponent(naziv)}`
      );
      
      if (response.data.ok) {
        alert('Tim uspješno obrisan!');
        fetchTimovi();
      }
    } catch (err) {
      alert('Greška: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const handleEditClick = (tim) => {
    setTimZaUredjivanje(tim);
    setPrikaziFormu(true);
  };

  const handleCancel = () => {
    setTimZaUredjivanje(null);
    setPrikaziFormu(false);
  };

  if (loading) {
    return <div className="loading">Učitavanje timova...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p> {error}</p>
        <button onClick={fetchTimovi}>Pokušaj ponovo</button>
      </div>
    );
  }

  return (
    <div className="tim-list-container">
      <div className="header">
        <h1>Upravljanje Timovima</h1>
        {!prikaziFormu && (
          <button 
            onClick={() => setPrikaziFormu(true)} 
            className="btn-add-new"
          >
            Dodaj Novi Tim
          </button>
        )}
      </div>

      {/* Forma za dodavanje/uređivanje */}
      {prikaziFormu && (
        <TimForm
          timZaUredjivanje={timZaUredjivanje}
          onSubmit={timZaUredjivanje ? handleUpdate : handleAdd}
          onCancel={handleCancel}
        />
      )}

      {/* Tablica timova */}
      <div className="timovi-table-wrapper">
        <h2>Popis Timova ({timovi.length})</h2>
        
        {timovi.length === 0 ? (
          <p className="no-data">Nema timova u bazi podataka.</p>
        ) : (
          <table className="timovi-table">
            <thead>
              <tr>
                <th>Naziv</th>
                <th>Grad</th>
                <th>Stadion</th>
                <th>Kapacitet</th>
                <th>God. osnivanja</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {timovi.map((tim) => (
                <TimItem
                  key={tim._id}
                  tim={tim}
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

export default TimList;