import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';
const SEZONA_API_URL = `${API_BASE}/api/sezona`;
const LIGA_API_URL = `${API_BASE}/api/liga`;


function SezonaForm({ sezonaZaUredjivanje, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    naziv: '',
    broj_kola: '',
    pocetak: '',
    kraj: '',
    liga_id: ''
  });

  const [lige, setLige] = useState([]);

  useEffect(() => {
    const fetchLige = async () => {
      try {
        const res = await axios.get(LIGA_API_URL);
        setLige(res.data.lige || []);
      } catch (err) {
        console.error('Greška pri dohvaćanju liga:', err);
        setLige([]);
      }
    };

    fetchLige();
  }, []);

  useEffect(() => {
    if (sezonaZaUredjivanje) {
      setFormData({
        naziv: sezonaZaUredjivanje.naziv || '',
        broj_kola: sezonaZaUredjivanje.broj_kola ?? '',
        pocetak: sezonaZaUredjivanje.pocetak || '',
        kraj: sezonaZaUredjivanje.kraj || '',
        liga_id: sezonaZaUredjivanje.liga_id || ''
      });
    } else {
      setFormData({
        naziv: '',
        broj_kola: '',
        pocetak: '',
        kraj: '',
        liga_id: ''
      });
    }
  }, [sezonaZaUredjivanje]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.naziv || !formData.naziv.trim()) {
      alert('Naziv sezone je obavezan!');
      return;
    }

    const dataToSend = {
      naziv: formData.naziv.trim(),
      broj_kola: formData.broj_kola !== '' ? parseInt(formData.broj_kola, 10) : null,
      pocetak: formData.pocetak !== '' ? formData.pocetak : null,
      kraj: formData.kraj !== '' ? formData.kraj : null,
      liga_id: formData.liga_id !== '' ? formData.liga_id : null
    };

    onSubmit(dataToSend);
  };

  const handleReset = () => {
    setFormData({
      naziv: '',
      broj_kola: '',
      pocetak: '',
      kraj: '',
      liga_id: ''
    });
    if (onCancel) onCancel();
  };

  const selectStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '1em',
    border: '2px solid #ddd',
    borderRadius: '5px'
  };

  return (
    <div className="tim-form">
      <h2>{sezonaZaUredjivanje ? 'Uredi Sezonu' : 'Dodaj Novu Sezonu'}</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Naziv sezone: *</label>
          <input
            type="text"
            name="naziv"
            value={formData.naziv}
            onChange={handleChange}
            placeholder="npr. 2024/2025"
            required
          />
        </div>

        <div className="form-group">
          <label>Broj kola:</label>
          <input
            type="number"
            name="broj_kola"
            value={formData.broj_kola}
            onChange={handleChange}
            placeholder="npr. 36"
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Početak (YYYY-MM-DD):</label>
          <input
            type="text"
            name="pocetak"
            value={formData.pocetak}
            onChange={handleChange}
            placeholder="npr. 2024-07-20"
          />
        </div>

        <div className="form-group">
          <label>Kraj (YYYY-MM-DD):</label>
          <input
            type="text"
            name="kraj"
            value={formData.kraj}
            onChange={handleChange}
            placeholder="npr. 2025-05-25"
          />
        </div>

        <div className="form-group">
          <label>Liga:</label>
          <select
            name="liga_id"
            value={formData.liga_id}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="">— Bez lige —</option>
            {lige.map(l => (
              <option key={l.id} value={l.id}>
                {l.naziv}
              </option>
            ))}
          </select>
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-submit">
            {sezonaZaUredjivanje ? 'Spremi Promjene' : 'Dodaj Sezonu'}
          </button>
          <button type="button" onClick={handleReset} className="btn-cancel">
            Odustani
          </button>
        </div>
      </form>
    </div>
  );
}

export default SezonaForm;

