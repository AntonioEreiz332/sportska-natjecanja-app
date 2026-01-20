import React from 'react';

function TimItem({ tim, onEdit, onDelete }) {
  return (
    <tr>
      <td>{tim.naziv}</td>
      <td>{tim.grad}</td>
      <td>{tim.stadion || '-'}</td>
      <td>{tim.kapacitet_stadiona || '-'}</td>
      <td>{tim.godina_osnivanja || '-'}</td>
      <td>
        <button 
          onClick={() => onEdit(tim)} 
          className="btn-edit"
        >
          Uredi
        </button>
        <button 
          onClick={() => onDelete(tim.naziv)} 
          className="btn-delete"
        >
          Obriši
        </button>
      </td>
    </tr>
  );
}

export default TimItem;