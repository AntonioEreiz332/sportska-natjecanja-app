import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';
const IGRAC_API_URL = `${API_BASE}/api/igrac`;
const TIM_API_URL = `${API_BASE}/api/tim`;


function IgracForm({ igracZaUredjivanje, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    ime: '',
    prezime: '',
    datum_rodenja: '',
    nacionalnost: '',
    pozicija: '',
    broj_dresa: '',
    tim_naziv: ''
  });

  const [timovi, setTimovi] = useState([]);

  useEffect(() => {
    // Dohvati timove za dropdown
    const fetchTimovi = async () => {
      try {
        const res = await axios.get(TIM_API_URL);
        setTimovi(res.data.timovi || []);
      } catch (err) {
        console.error('Greška pri dohvaćanju timova:', err);
        setTimovi([]);
      }
    };

    fetchTimovi();
  }, []);

  useEffect(() => {
    if (igracZaUredjivanje) {
      setFormData({
        ime: igracZaUredjivanje.ime || '',
        prezime: igracZaUredjivanje.prezime || '',
        datum_rodenja: igracZaUredjivanje.datum_rodenja || '',
        nacionalnost: igracZaUredjivanje.nacionalnost || '',
        pozicija: igracZaUredjivanje.pozicija || '',
        broj_dresa: igracZaUredjivanje.broj_dresa ?? '',
        tim_naziv: igracZaUredjivanje.tim_naziv || ''
      });
    } else {
      setFormData({
        ime: '',
        prezime: '',
        datum_rodenja: '',
        nacionalnost: '',
        pozicija: '',
        broj_dresa: '',
        tim_naziv: ''
      });
    }
  }, [igracZaUredjivanje]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.ime || !formData.prezime) {
      alert('Ime i prezime su obavezna polja!');
      return;
    }

    const dataToSend = {
      ...formData,
      broj_dresa: formData.broj_dresa !== '' ? parseInt(formData.broj_dresa, 10) : null,
      tim_naziv: formData.tim_naziv !== '' ? formData.tim_naziv : null
    };

    onSubmit(dataToSend);
  };

  const handleReset = () => {
    setFormData({
      ime: '',
      prezime: '',
      datum_rodenja: '',
      nacionalnost: '',
      pozicija: '',
      broj_dresa: '',
      tim_naziv: ''
    });
    if (onCancel) onCancel();
  };

  return (
    <div className="tim-form">
      <h2>{igracZaUredjivanje ? 'Uredi Igrača' : 'Dodaj Novog Igrača'}</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Ime: *</label>
          <input
            type="text"
            name="ime"
            value={formData.ime}
            onChange={handleChange}
            placeholder="npr. Ivan"
            required
          />
        </div>

        <div className="form-group">
          <label>Prezime: *</label>
          <input
            type="text"
            name="prezime"
            value={formData.prezime}
            onChange={handleChange}
            placeholder="npr. Rakitić"
            required
          />
        </div>

        <div className="form-group">
          <label>Datum rođenja:</label>
          <input
            type="text"
            name="datum_rodenja"
            value={formData.datum_rodenja}
            onChange={handleChange}
            placeholder="npr. 1988-03-10"
          />
        </div>

        <div className="form-group">
          <label>Nacionalnost:</label>
          <input
            type="text"
            name="nacionalnost"
            value={formData.nacionalnost}
            onChange={handleChange}
            placeholder="npr. Hrvatska"
          />
        </div>

        <div className="form-group">
          <label>Pozicija:</label>
          <input
            type="text"
            name="pozicija"
            value={formData.pozicija}
            onChange={handleChange}
            placeholder="npr. Vezni"
          />
        </div>

        <div className="form-group">
          <label>Broj dresa:</label>
          <input
            type="number"
            name="broj_dresa"
            value={formData.broj_dresa}
            onChange={handleChange}
            placeholder="npr. 4"
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Tim:</label>
          <select
            name="tim_naziv"
            value={formData.tim_naziv}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1em',
              border: '2px solid #ddd',
              borderRadius: '5px'
            }}
          >
            <option value="">— Bez tima —</option>
            {timovi.map((t) => (
              <option key={t._id} value={t.naziv}>
                {t.naziv}
              </option>
            ))}
          </select>
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-submit">
            {igracZaUredjivanje ? 'Spremi Promjene' : 'Dodaj Igrača'}
          </button>
          <button type="button" onClick={handleReset} className="btn-cancel">
            Odustani
          </button>
        </div>
      </form>
    </div>
  );
}

export default IgracForm;


