import React, { useState, useEffect } from 'react';

function TimForm({ timZaUredjivanje, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    naziv: '',
    grad: '',
    stadion: '',
    kapacitet_stadiona: '',
    godina_osnivanja: ''
  });

  useEffect(() => {
    if (timZaUredjivanje) {
      setFormData({
        naziv: timZaUredjivanje.naziv || '',
        grad: timZaUredjivanje.grad || '',
        stadion: timZaUredjivanje.stadion || '',
        kapacitet_stadiona: timZaUredjivanje.kapacitet_stadiona || '',
        godina_osnivanja: timZaUredjivanje.godina_osnivanja || ''
      });
    }
  }, [timZaUredjivanje]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.naziv || !formData.grad) {
      alert('Naziv i grad su obavezna polja!');
      return;
    }

    const dataToSend = {
      ...formData,
      kapacitet_stadiona: formData.kapacitet_stadiona ? parseInt(formData.kapacitet_stadiona) : null,
      godina_osnivanja: formData.godina_osnivanja ? parseInt(formData.godina_osnivanja) : null
    };

    onSubmit(dataToSend);
  };

  const handleReset = () => {
    setFormData({
      naziv: '',
      grad: '',
      stadion: '',
      kapacitet_stadiona: '',
      godina_osnivanja: ''
    });
    if (onCancel) onCancel();
  };

  return (
    <div className="tim-form">
      <h2>{timZaUredjivanje ? 'Uredi Tim' : 'Dodaj Novi Tim'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Naziv tima: *</label>
          <input
            type="text"
            name="naziv"
            value={formData.naziv}
            onChange={handleChange}
            placeholder="npr. NK Varaždin"
            disabled={!!timZaUredjivanje}
            required
          />
        </div>

        <div className="form-group">
          <label>Grad: *</label>
          <input
            type="text"
            name="grad"
            value={formData.grad}
            onChange={handleChange}
            placeholder="npr. Varaždin"
            required
          />
        </div>

        <div className="form-group">
          <label>Stadion:</label>
          <input
            type="text"
            name="stadion"
            value={formData.stadion}
            onChange={handleChange}
            placeholder="npr. Anđelko Herjavec"
          />
        </div>

        <div className="form-group">
          <label>Kapacitet stadiona:</label>
          <input
            type="number"
            name="kapacitet_stadiona"
            value={formData.kapacitet_stadiona}
            onChange={handleChange}
            placeholder="npr. 10800"
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Godina osnivanja:</label>
          <input
            type="number"
            name="godina_osnivanja"
            value={formData.godina_osnivanja}
            onChange={handleChange}
            placeholder="npr. 2012"
            min="1800"
            max={new Date().getFullYear()}
          />
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-submit">
            {timZaUredjivanje ? 'Spremi Promjene' : 'Dodaj Tim'}
          </button>
          <button type="button" onClick={handleReset} className="btn-cancel">
            Odustani
          </button>
        </div>
      </form>
    </div>
  );
}

export default TimForm;