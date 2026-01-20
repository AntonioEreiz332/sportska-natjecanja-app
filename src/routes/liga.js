const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const { getSession } = require('../db/neo4j');

function toNeoIntOrNull(v) {
  if (v === undefined) return undefined; // ne mijenjaj polje
  if (v === null || v === '') return null;

  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return neo4j.int(n);
}

function formatNode(node) {
  if (!node) return null;
  const props = { ...node.properties };

  for (const k of Object.keys(props)) {
    const v = props[k];
    if (neo4j.isInt(v)) props[k] = v.toNumber();
  }

  props.id = node.elementId; // stabilni ID
  return props;
}

/* =========================================================
   CREATE
   POST /api/liga
   Body:
   {
     "naziv": "Prva HNL",
     "drzava": "Hrvatska",
     "razina": 1,
     "godina_osnivanja": 1992
   }
========================================================= */
router.post('/', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.WRITE });

  try {
    const { naziv, drzava, razina, godina_osnivanja } = req.body;

    if (!naziv || !naziv.trim()) {
      return res.status(400).json({ ok: false, message: 'Naziv lige je obavezan.' });
    }

    const result = await session.executeWrite(tx =>
      tx.run(
        `
        CREATE (l:Liga {
          naziv: $naziv,
          drzava: $drzava,
          razina: $razina,
          godina_osnivanja: $godina_osnivanja
        })
        RETURN l
        `,
        {
          naziv: naziv.trim(),
          drzava: drzava || null,
          razina: toNeoIntOrNull(razina),
          godina_osnivanja: toNeoIntOrNull(godina_osnivanja)
        }
      )
    );

    if (!result.records || result.records.length === 0) {
      return res.status(500).json({ ok: false, message: 'Neo4j nije vratio kreirani čvor.' });
    }

    const liga = formatNode(result.records[0].get('l'));

    res.status(201).json({
      ok: true,
      message: 'Liga uspješno dodana',
      liga
    });

  } catch (err) {
    console.error('Greška pri kreiranju lige:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   READ ALL
   GET /api/liga
========================================================= */
router.get('/', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.READ });

  try {
    const result = await session.executeRead(tx =>
      tx.run(
        `
        MATCH (l:Liga)
        RETURN l
        ORDER BY l.naziv
        `
      )
    );

    const lige = result.records.map(r => formatNode(r.get('l')));

    res.json({
      ok: true,
      count: lige.length,
      lige
    });

  } catch (err) {
    console.error('Greška pri dohvaćanju liga:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   READ ONE
   GET /api/liga/:id
========================================================= */
router.get('/:id', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.READ });
  const { id } = req.params;

  try {
    const result = await session.executeRead(tx =>
      tx.run(
        `
        MATCH (l:Liga)
        WHERE elementId(l) = $id
        RETURN l
        `,
        { id }
      )
    );

    if (!result.records || result.records.length === 0) {
      return res.status(404).json({ ok: false, message: 'Liga nije pronađena.' });
    }

    res.json({
      ok: true,
      liga: formatNode(result.records[0].get('l'))
    });

  } catch (err) {
    console.error('Greška pri dohvaćanju lige:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   UPDATE
   PUT /api/liga/:id
   Body može imati bilo koja polja
========================================================= */
router.put('/:id', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.WRITE });
  const { id } = req.params;

  try {
    const { naziv, drzava, razina, godina_osnivanja } = req.body;

    const props = {};
    if (naziv !== undefined) props.naziv = naziv;
    if (drzava !== undefined) props.drzava = drzava;
    if (razina !== undefined) props.razina = toNeoIntOrNull(razina);
    if (godina_osnivanja !== undefined) props.godina_osnivanja = toNeoIntOrNull(godina_osnivanja);

    const result = await session.executeWrite(tx =>
      tx.run(
        `
        MATCH (l:Liga)
        WHERE elementId(l) = $id
        SET l += $props
        RETURN l
        `,
        { id, props }
      )
    );

    if (!result.records || result.records.length === 0) {
      return res.status(404).json({ ok: false, message: 'Liga nije pronađena.' });
    }

    res.json({
      ok: true,
      message: 'Liga uspješno ažurirana',
      liga: formatNode(result.records[0].get('l'))
    });

  } catch (err) {
    console.error('Greška pri ažuriranju lige:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   DELETE
   DELETE /api/liga/:id
========================================================= */
router.delete('/:id', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.WRITE });
  const { id } = req.params;

  try {
    const check = await session.executeRead(tx =>
      tx.run(
        `MATCH (l:Liga) WHERE elementId(l) = $id RETURN l`,
        { id }
      )
    );

    if (!check.records || check.records.length === 0) {
      return res.status(404).json({ ok: false, message: 'Liga nije pronađena.' });
    }

    await session.executeWrite(tx =>
      tx.run(
        `MATCH (l:Liga) WHERE elementId(l) = $id DETACH DELETE l`,
        { id }
      )
    );

    res.json({ ok: true, message: 'Liga uspješno obrisana' });

  } catch (err) {
    console.error('Greška pri brisanju lige:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
