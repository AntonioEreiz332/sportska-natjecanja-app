const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const { getSession } = require('../db/neo4j');


function formatNode(node) {
  if (!node) return null;
  const props = { ...node.properties };

    for (const k of Object.keys(props)) {
    const v = props[k];

  
    if (neo4j.isInt(v)) {
      props[k] = v.toNumber();
      continue;
    }

    
    if (v && typeof v === 'object' && v.year != null && v.month != null && v.day != null) {
      const y = String(v.year).padStart(4, '0');
      const m = String(v.month).padStart(2, '0');
      const d = String(v.day).padStart(2, '0');
      props[k] = `${y}-${m}-${d}`;
      continue;
    }
  }


  props.id = node.elementId;
  return props;
}

/* =========================================================
   CREATE IGRAC
   POST /api/igrac
========================================================= */
router.post('/', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.WRITE });

  try {
    const {
      ime,
      prezime,
      datum_rodenja,
      nacionalnost,
      pozicija,
      broj_dresa,
      tim_naziv
    } = req.body;

    if (!ime || !prezime) {
      return res.status(400).json({
        ok: false,
        message: 'Ime i prezime su obavezna polja'
      });
    }

    const result = await session.executeWrite(tx =>
      tx.run(
        `
        CREATE (i:Igrac {
          ime: $ime,
          prezime: $prezime,
          datum_rodenja: $datum_rodenja,
          nacionalnost: $nacionalnost,
          pozicija: $pozicija,
          broj_dresa: $broj_dresa
        })
        WITH i
        OPTIONAL MATCH (t:Tim {naziv: $tim_naziv})
        FOREACH (_ IN CASE WHEN t IS NULL THEN [] ELSE [1] END |
          MERGE (i)-[:IGRA_ZA]->(t)
        )
        RETURN i
        `,
        {
          ime,
          prezime,
          datum_rodenja: datum_rodenja || null,
          nacionalnost: nacionalnost || null,
          pozicija: pozicija || null,
          broj_dresa:
            broj_dresa !== undefined && broj_dresa !== null
              ? neo4j.int(broj_dresa)
              : null,
          tim_naziv: tim_naziv || null
        }
      )
    );

    const igrac = formatNode(result.records[0].get('i'));

    res.status(201).json({
      ok: true,
      message: 'Igrač uspješno kreiran',
      igrac
    });

  } catch (err) {
    console.error('Greška pri kreiranju igrača:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   READ ALL
   GET /api/igrac
========================================================= */
router.get('/', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.READ });

  try {
    const result = await session.executeRead(tx =>
      tx.run(
        `
        MATCH (i:Igrac)
        OPTIONAL MATCH (i)-[:IGRA_ZA]->(t:Tim)
        RETURN i, t
        ORDER BY i.prezime, i.ime
        `
      )
    );

    const igraci = result.records.map(r => {
      const igrac = formatNode(r.get('i'));
      const tim = r.get('t');

      return {
        ...igrac,
        nacionalnost: igrac.nacionalnost ?? igrac.drzavljanstvo ?? null,
        datum_rodenja: igrac.datum_rodjenja ?? igrac.datum_rodenja ?? null,
        tim_naziv: tim ? tim.properties.naziv : null
      };
    });

    res.json({
      ok: true,
      count: igraci.length,
      igraci
    });

  } catch (err) {
    console.error('Greška pri dohvaćanju igrača:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   READ ONE
   GET /api/igrac/:id
========================================================= */
router.get('/:id', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.READ });
  const { id } = req.params;

  try {
    const result = await session.executeRead(tx =>
      tx.run(
        `
        MATCH (i:Igrac)
        WHERE elementId(i) = $id
        OPTIONAL MATCH (i)-[:IGRA_ZA]->(t:Tim)
        RETURN i, t
        `,
        { id }
      )
    );

    if (result.records.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Igrač nije pronađen'
      });
    }

    const igrac = formatNode(result.records[0].get('i'));
    const tim = result.records[0].get('t');

    res.json({
      ok: true,
      igrac: {
        ...igrac,
        nacionalnost: igrac.nacionalnost ?? igrac.drzavljanstvo ?? null,
        datum_rodenja: igrac.datum_rodjenja ?? igrac.datum_rodenja ?? null,
        tim_naziv: tim ? tim.properties.naziv : null
      }
    });

  } catch (err) {
    console.error('Greška pri dohvaćanju igrača:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   UPDATE
   PUT /api/igrac/:id
========================================================= */
router.put('/:id', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.WRITE });
  const { id } = req.params;

  try {
    const {
      ime,
      prezime,
      datum_rodenja,
      nacionalnost,
      pozicija,
      broj_dresa,
      tim_naziv
    } = req.body;

    // Provjera postoji li igrač
    const check = await session.executeRead(tx =>
      tx.run(
        `MATCH (i:Igrac) WHERE elementId(i) = $id RETURN i`,
        { id }
      )
    );

    if (check.records.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Igrač nije pronađen'
      });
    }

    const props = {};
    if (ime !== undefined) props.ime = ime;
    if (prezime !== undefined) props.prezime = prezime;
    if (datum_rodenja !== undefined) props.datum_rodenja = datum_rodenja;
    if (nacionalnost !== undefined) props.nacionalnost = nacionalnost;
    if (pozicija !== undefined) props.pozicija = pozicija;
    if (broj_dresa !== undefined)
      props.broj_dresa =
        broj_dresa !== null ? neo4j.int(broj_dresa) : null;

    const wantsTeamChange = tim_naziv !== undefined;

    const result = await session.executeWrite(tx =>
      tx.run(
        `
        MATCH (i:Igrac)
        WHERE elementId(i) = $id
        SET i += $props
        WITH i
        ${wantsTeamChange ? 'OPTIONAL MATCH (i)-[r:IGRA_ZA]->(:Tim) DELETE r' : ''}
        WITH i
        ${wantsTeamChange ? `
          OPTIONAL MATCH (t:Tim {naziv: $tim_naziv})
          FOREACH (_ IN CASE WHEN t IS NULL THEN [] ELSE [1] END |
            MERGE (i)-[:IGRA_ZA]->(t)
          )
        ` : ''}
        RETURN i
        `,
        {
          id,
          props,
          tim_naziv: tim_naziv || null
        }
      )
    );

    const igrac = formatNode(result.records[0].get('i'));

    res.json({
      ok: true,
      message: 'Igrač uspješno ažuriran',
      igrac
    });

  } catch (err) {
    console.error('Greška pri ažuriranju igrača:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   DELETE
   DELETE /api/igrac/:id
========================================================= */
router.delete('/:id', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.WRITE });
  const { id } = req.params;

  try {
    const check = await session.executeRead(tx =>
      tx.run(
        `MATCH (i:Igrac) WHERE elementId(i) = $id RETURN i`,
        { id }
      )
    );

    if (check.records.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Igrač nije pronađen'
      });
    }

    await session.executeWrite(tx =>
      tx.run(
        `MATCH (i:Igrac) WHERE elementId(i) = $id DETACH DELETE i`,
        { id }
      )
    );

    res.json({
      ok: true,
      message: 'Igrač uspješno obrisan'
    });

  } catch (err) {
    console.error('Greška pri brisanju igrača:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
