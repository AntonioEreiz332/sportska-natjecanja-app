import React from 'react';

function UtakmicaItem({ utakmica, onEdit, onDelete }) {
  return (
    <tr>
      <td>{utakmica.datum || '-'}</td>
      <td>{utakmica.kolo ?? '-'}</td>
      <td>{utakmica.stadion || '-'}</td>
      <td>{utakmica.domacin_naziv || '-'}</td>
      <td>{utakmica.gost_naziv || '-'}</td>
      <td>{utakmica.broj_gledatelja ?? '-'}</td>
      <td>
        <button onClick={() => onEdit(utakmica)} className="btn-edit">Uredi</button>
        <button onClick={() => onDelete(utakmica.id)} className="btn-delete">Obriši</button>
      </td>
    </tr>
  );
}

export default UtakmicaItem;
