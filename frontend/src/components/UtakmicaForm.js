import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/tim`;

function UtakmicaForm({ utakmicaZaUredjivanje, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    datum: '',
    kolo: '',
    stadion: '',
    broj_gledatelja: '',
    domacin_naziv: '',
    gost_naziv: ''
  });

  const [timovi, setTimovi] = useState([]);

  useEffect(() => {
    const fetchTimovi = async () => {
      try {
        const res = await axios.get(API_URL);
        setTimovi(res.data.timovi || []);
      } catch (err) {
        console.error('Greška pri dohvaćanju timova:', err);
        setTimovi([]);
      }
    };
    fetchTimovi();
  }, []);

  useEffect(() => {
    if (utakmicaZaUredjivanje) {
      setFormData({
        datum: utakmicaZaUredjivanje.datum || '',
        kolo: utakmicaZaUredjivanje.kolo ?? '',
        stadion: utakmicaZaUredjivanje.stadion || '',
        broj_gledatelja: utakmicaZaUredjivanje.broj_gledatelja ?? '',
        domacin_naziv: utakmicaZaUredjivanje.domacin_naziv || '',
        gost_naziv: utakmicaZaUredjivanje.gost_naziv || ''
      });
    } else {
      setFormData({
        datum: '',
        kolo: '',
        stadion: '',
        broj_gledatelja: '',
        domacin_naziv: '',
        gost_naziv: ''
      });
    }
  }, [utakmicaZaUredjivanje]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.datum || !formData.domacin_naziv || !formData.gost_naziv) {
      alert('Datum, domaćin i gost su obavezni!');
      return;
    }

    if (formData.domacin_naziv === formData.gost_naziv) {
      alert('Domaćin i gost ne mogu biti isti tim!');
      return;
    }

    const dataToSend = {
      ...formData,
      kolo: formData.kolo !== '' ? parseInt(formData.kolo, 10) : null,
      broj_gledatelja: formData.broj_gledatelja !== '' ? parseInt(formData.broj_gledatelja, 10) : null,
      stadion: formData.stadion !== '' ? formData.stadion : null
    };

    onSubmit(dataToSend);
  };

  const handleReset = () => {
    setFormData({
      datum: '',
      kolo: '',
      stadion: '',
      broj_gledatelja: '',
      domacin_naziv: '',
      gost_naziv: ''
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
      <h2>
        {utakmicaZaUredjivanje ? "Uredi Utakmicu" : "Dodaj Novu Utakmicu"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Datum (ISO): *</label>
          <input
            type="text"
            name="datum"
            value={formData.datum}
            onChange={handleChange}
            placeholder="npr. 2024-08-18T18:00:00Z"
            required
          />
        </div>

        <div className="form-group">
          <label>Kolo:</label>
          <input
            type="number"
            name="kolo"
            value={formData.kolo}
            onChange={handleChange}
            placeholder="npr. 2"
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Stadion:</label>
          <input
            type="text"
            name="stadion"
            value={formData.stadion}
            onChange={handleChange}
            placeholder="npr. Rujevica"
          />
        </div>

        <div className="form-group">
          <label>Domaćin: *</label>
          <select
            name="domacin_naziv"
            value={formData.domacin_naziv}
            onChange={handleChange}
            style={selectStyle}
            required
          >
            <option value="">— Odaberi domaćina —</option>
            {timovi.map((t) => (
              <option key={t._id} value={t.naziv}>
                {t.naziv}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Gost: *</label>
          <select
            name="gost_naziv"
            value={formData.gost_naziv}
            onChange={handleChange}
            style={selectStyle}
            required
          >
            <option value="">— Odaberi gosta —</option>
            {timovi.map((t) => (
              <option key={t._id} value={t.naziv}>
                {t.naziv}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Broj gledatelja:</label>
          <input
            type="number"
            name="broj_gledatelja"
            value={formData.broj_gledatelja}
            onChange={handleChange}
            placeholder="npr. 18750"
            min="0"
          />
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-submit">
            {utakmicaZaUredjivanje ? "Spremi Promjene" : "Dodaj Utakmicu"}
          </button>
          <button type="button" onClick={handleReset} className="btn-cancel">
            Odustani
          </button>
        </div>
      </form>
    </div>
  );
}

export default UtakmicaForm;
