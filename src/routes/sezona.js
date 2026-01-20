const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const { getSession } = require('../db/neo4j');

function toNeoIntOrNull(v) {
  if (v === undefined) return undefined; // ne mijenjaj
  if (v === null || v === '') return null;

  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return neo4j.int(n);
}

// Date u bazi izgleda kao "2024-07-20" (string) ili Neo4j date objekt.
// Ovo normalizira u string YYYY-MM-DD.
function normalizeDate(v) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;

  if (typeof v === 'string') return v;

  if (typeof v === 'object' && v && v.year != null && v.month != null && v.day != null) {
    const y = String(v.year).padStart(4, '0');
    const m = String(v.month).padStart(2, '0');
    const d = String(v.day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof v === 'object' && v && typeof v.toString === 'function') {
    const s = v.toString();
    if (s && s !== '[object Object]') return s;
  }

  return String(v);
}

function formatNode(node) {
  if (!node) return null;
  const props = { ...node.properties };

  for (const k of Object.keys(props)) {
    const v = props[k];

    if (neo4j.isInt(v)) {
      props[k] = v.toNumber();
      continue;
    }

    if (k === 'pocetak' || k === 'kraj') {
      props[k] = normalizeDate(v);
      continue;
    }
  }

  props.id = node.elementId;
  return props;
}

/* =========================================================
   CREATE
   POST /api/sezona
   Body:
   {
     "naziv": "2024/2025",
     "broj_kola": 36,
     "pocetak": "2024-07-20",
     "kraj": "2025-05-25",
     "liga_id": "<elementId Lige>"   // opcionalno
   }
========================================================= */
router.post('/', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.WRITE });

  try {
    const { naziv, broj_kola, pocetak, kraj, liga_id } = req.body;

    if (!naziv || !naziv.trim()) {
      return res.status(400).json({ ok: false, message: 'Naziv sezone je obavezan.' });
    }

    const result = await session.executeWrite(tx =>
      tx.run(
        `
        CREATE (s:Sezona {
          naziv: $naziv,
          broj_kola: $broj_kola,
          pocetak: $pocetak,
          kraj: $kraj
        })
        WITH s
        OPTIONAL MATCH (l:Liga)
        WHERE elementId(l) = $liga_id
        FOREACH (_ IN CASE WHEN l IS NULL THEN [] ELSE [1] END |
          MERGE (l)-[:IMA_SEZONU]->(s)
        )
        RETURN s
        `,
        {
          naziv: naziv.trim(),
          broj_kola: toNeoIntOrNull(broj_kola),
          pocetak: normalizeDate(pocetak),
          kraj: normalizeDate(kraj),
          liga_id: liga_id || null
        }
      )
    );

    if (!result.records || result.records.length === 0) {
      return res.status(500).json({ ok: false, message: 'Neo4j nije vratio kreirani čvor.' });
    }

    const sezona = formatNode(result.records[0].get('s'));

    res.status(201).json({
      ok: true,
      message: 'Sezona uspješno dodana',
      sezona
    });

  } catch (err) {
    console.error('Greška pri kreiranju sezone:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   READ ALL
   GET /api/sezona
   Vraća i ligu ako postoji
========================================================= */
router.get('/', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.READ });

  try {
    const result = await session.executeRead(tx =>
      tx.run(
        `
        MATCH (s:Sezona)
        OPTIONAL MATCH (l:Liga)-[:IMA_SEZONU]->(s)
        RETURN s, l
        ORDER BY s.naziv DESC
        `
      )
    );

    const sezone = result.records.map(r => {
      const s = formatNode(r.get('s'));
      const l = r.get('l');

      return {
        ...s,
        liga_id: l ? l.elementId : null,
        liga_naziv: l ? l.properties.naziv : null
      };
    });

    res.json({
      ok: true,
      count: sezone.length,
      sezone
    });

  } catch (err) {
    console.error('Greška pri dohvaćanju sezona:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   READ ONE
   GET /api/sezona/:id
========================================================= */
router.get('/:id', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.READ });
  const { id } = req.params;

  try {
    const result = await session.executeRead(tx =>
      tx.run(
        `
        MATCH (s:Sezona)
        WHERE elementId(s) = $id
        OPTIONAL MATCH (l:Liga)-[:IMA_SEZONU]->(s)
        RETURN s, l
        `,
        { id }
      )
    );

    if (!result.records || result.records.length === 0) {
      return res.status(404).json({ ok: false, message: 'Sezona nije pronađena.' });
    }

    const s = formatNode(result.records[0].get('s'));
    const l = result.records[0].get('l');

    res.json({
      ok: true,
      sezona: {
        ...s,
        liga_id: l ? l.elementId : null,
        liga_naziv: l ? l.properties.naziv : null
      }
    });

  } catch (err) {
    console.error('Greška pri dohvaćanju sezone:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   UPDATE
   PUT /api/sezona/:id
   Body može imati:
   { naziv, broj_kola, pocetak, kraj, liga_id }
========================================================= */
router.put('/:id', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.WRITE });
  const { id } = req.params;

  try {
    const { naziv, broj_kola, pocetak, kraj, liga_id } = req.body;

    const check = await session.executeRead(tx =>
      tx.run(`MATCH (s:Sezona) WHERE elementId(s) = $id RETURN s`, { id })
    );

    if (!check.records || check.records.length === 0) {
      return res.status(404).json({ ok: false, message: 'Sezona nije pronađena.' });
    }

    const props = {};
    if (naziv !== undefined) props.naziv = naziv;
    if (broj_kola !== undefined) props.broj_kola = toNeoIntOrNull(broj_kola);
    if (pocetak !== undefined) props.pocetak = normalizeDate(pocetak);
    if (kraj !== undefined) props.kraj = normalizeDate(kraj);

    const result = await session.executeWrite(tx =>
      tx.run(
        `
        MATCH (s:Sezona)
        WHERE elementId(s) = $id
        SET s += $props
        WITH s
        CALL {
          WITH s
          OPTIONAL MATCH (oldLiga:Liga)-[r:IMA_SEZONU]->(s)
          DELETE r
          WITH s
          OPTIONAL MATCH (newLiga:Liga)
          WHERE elementId(newLiga) = $liga_id
          FOREACH (_ IN CASE WHEN newLiga IS NULL THEN [] ELSE [1] END |
            MERGE (newLiga)-[:IMA_SEZONU]->(s)
          )
          RETURN 1 AS ok
        }
        RETURN s
        `,
        {
          id,
          props,
          liga_id: liga_id || null
        }
      )
    );

    const sezona = formatNode(result.records[0].get('s'));

    res.json({
      ok: true,
      message: 'Sezona uspješno ažurirana',
      sezona
    });

  } catch (err) {
    console.error('Greška pri ažuriranju sezone:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   DELETE
   DELETE /api/sezona/:id
========================================================= */
router.delete('/:id', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.WRITE });
  const { id } = req.params;

  try {
    const check = await session.executeRead(tx =>
      tx.run(`MATCH (s:Sezona) WHERE elementId(s) = $id RETURN s`, { id })
    );

    if (!check.records || check.records.length === 0) {
      return res.status(404).json({ ok: false, message: 'Sezona nije pronađena.' });
    }

    await session.executeWrite(tx =>
      tx.run(`MATCH (s:Sezona) WHERE elementId(s) = $id DETACH DELETE s`, { id })
    );

    res.json({ ok: true, message: 'Sezona uspješno obrisana' });

  } catch (err) {
    console.error('Greška pri brisanju sezone:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
