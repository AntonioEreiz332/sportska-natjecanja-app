import React from 'react';

function SezonaItem({ sezona, onEdit, onDelete }) {
  return (
    <tr>
      <td>{sezona.naziv}</td>
      <td>{sezona.broj_kola ?? '-'}</td>
      <td>{sezona.pocetak || '-'}</td>
      <td>{sezona.kraj || '-'}</td>
      <td>{sezona.liga_naziv || '-'}</td>
      <td>
        <button onClick={() => onEdit(sezona)} className="btn-edit">
          Uredi
        </button>
        <button onClick={() => onDelete(sezona.id)} className="btn-delete">
          Obriši
        </button>
      </td>
    </tr>
  );
}

export default SezonaItem;
