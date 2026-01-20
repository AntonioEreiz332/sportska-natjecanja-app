import React from 'react';

function LigaItem({ liga, onEdit, onDelete }) {
  return (
    <tr>
      <td>{liga.naziv}</td>
      <td>{liga.drzava || '-'}</td>
      <td>{liga.razina ?? '-'}</td>
      <td>{liga.godina_osnivanja ?? '-'}</td>
      <td>
        <button onClick={() => onEdit(liga)} className="btn-edit">
          Uredi
        </button>
        <button onClick={() => onDelete(liga.id)} className="btn-delete">
          Obriši
        </button>
      </td>
    </tr>
  );
}

export default LigaItem;
