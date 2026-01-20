import React, { useState, useEffect } from 'react';

function LigaForm({ ligaZaUredjivanje, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    naziv: '',
    drzava: '',
    razina: '',
    godina_osnivanja: ''
  });

  useEffect(() => {
    if (ligaZaUredjivanje) {
      setFormData({
        naziv: ligaZaUredjivanje.naziv || '',
        drzava: ligaZaUredjivanje.drzava || '',
        razina: ligaZaUredjivanje.razina ?? '',
        godina_osnivanja: ligaZaUredjivanje.godina_osnivanja ?? ''
      });
    } else {
      setFormData({
        naziv: '',
        drzava: '',
        razina: '',
        godina_osnivanja: ''
      });
    }
  }, [ligaZaUredjivanje]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.naziv || !formData.naziv.trim()) {
      alert('Naziv lige je obavezan!');
      return;
    }

    const dataToSend = {
      naziv: formData.naziv.trim(),
      drzava: formData.drzava !== '' ? formData.drzava : null,
      razina: formData.razina !== '' ? parseInt(formData.razina, 10) : null,
      godina_osnivanja: formData.godina_osnivanja !== '' ? parseInt(formData.godina_osnivanja, 10) : null
    };

    onSubmit(dataToSend);
  };

  const handleReset = () => {
    setFormData({
      naziv: '',
      drzava: '',
      razina: '',
      godina_osnivanja: ''
    });
    if (onCancel) onCancel();
  };

  return (
    <div className="tim-form">
      <h2>{ligaZaUredjivanje ? 'Uredi Ligu' : 'Dodaj Novu Ligu'}</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Naziv lige: *</label>
          <input
            type="text"
            name="naziv"
            value={formData.naziv}
            onChange={handleChange}
            placeholder="npr. Prva HNL"
            required
          />
        </div>

        <div className="form-group">
          <label>Država:</label>
          <input
            type="text"
            name="drzava"
            value={formData.drzava}
            onChange={handleChange}
            placeholder="npr. Hrvatska"
          />
        </div>

        <div className="form-group">
          <label>Razina:</label>
          <input
            type="number"
            name="razina"
            value={formData.razina}
            onChange={handleChange}
            placeholder="npr. 1"
            min="1"
          />
        </div>

        <div className="form-group">
          <label>Godina osnivanja:</label>
          <input
            type="number"
            name="godina_osnivanja"
            value={formData.godina_osnivanja}
            onChange={handleChange}
            placeholder="npr. 1992"
            min="1800"
            max={new Date().getFullYear()}
          />
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-submit">
            {ligaZaUredjivanje ? 'Spremi Promjene' : 'Dodaj Ligu'}
          </button>
          <button type="button" onClick={handleReset} className="btn-cancel">
            Odustani
          </button>
        </div>
      </form>
    </div>
  );
}

export default LigaForm;
