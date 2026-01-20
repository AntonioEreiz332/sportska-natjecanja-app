import React from 'react';

function IgracItem({ igrac, onEdit, onDelete }) {
  return (
    <tr>
      <td>{igrac.ime}</td>
      <td>{igrac.prezime}</td>
      <td>{igrac.pozicija || '-'}</td>
      <td>{igrac.broj_dresa ?? '-'}</td>
      <td>{igrac.nacionalnost || '-'}</td>
      <td>{igrac.datum_rodenja || '-'}</td>
      <td>{igrac.tim_naziv || '-'}</td>
      <td>
        <button
          onClick={() => onEdit(igrac)}
          className="btn-edit"
        >
          Uredi
        </button>
        <button
          onClick={() => onDelete(igrac.id)}
          className="btn-delete"
        >
          Obriši
        </button>
      </td>
    </tr>
  );
}

export default IgracItem;
