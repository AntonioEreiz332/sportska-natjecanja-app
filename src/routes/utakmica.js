const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const { getSession } = require('../db/neo4j');

function normalizeDatum(v) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;

  if (typeof v === 'string') return v;

  // neo4j temporal types često imaju toString()
  if (typeof v === 'object' && v && typeof v.toString === 'function') {
    const s = v.toString();
    if (s && s !== '[object Object]') return s;
  }

  // ako dođe kao {year, month, day, hour, minute, second...}
  if (typeof v === 'object' && v && v.year != null && v.month != null && v.day != null) {
    const y = String(v.year).padStart(4, '0');
    const m = String(v.month).padStart(2, '0');
    const d = String(v.day).padStart(2, '0');

    if (v.hour != null && v.minute != null) {
      const hh = String(v.hour).padStart(2, '0');
      const mm = String(v.minute).padStart(2, '0');
      const ss = String(v.second ?? 0).padStart(2, '0');
      return `${y}-${m}-${d}T${hh}:${mm}:${ss}Z`;
    }

    return `${y}-${m}-${d}`;
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

    // Ako je datum/datetime objekt, pretvori u string
    if (k === 'datum' || k.toLowerCase().includes('datum')) {
      props[k] = normalizeDatum(v);
      continue;
    }
  }

  // dodatna sigurnost
  if (props.datum !== undefined) props.datum = normalizeDatum(props.datum);

  props.id = node.elementId;
  return props;
}

function toNeoIntOrNull(v) {
  if (v === undefined) return undefined; // ne mijenjaj polje
  if (v === null || v === '') return null;

  const n = Number(v);
  if (!Number.isFinite(n)) return null;

  return neo4j.int(n);
}

/* =========================================================
   CREATE
   POST /api/utakmica
   Body:
   {
     "datum": "2024-08-24T20:00:00Z",
     "kolo": 3,
     "stadion": "Maksimir",
     "broj_gledatelja": 18750,
     "domacin_naziv": "Dinamo Zagreb",
     "gost_naziv": "Osijek"
   }
========================================================= */
router.post('/', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.WRITE });

  try {
    const { datum, kolo, stadion, broj_gledatelja, domacin_naziv, gost_naziv } = req.body;

    if (!datum || !domacin_naziv || !gost_naziv) {
      return res.status(400).json({
        ok: false,
        message: 'Datum, domaćin i gost su obavezni.'
      });
    }

    const datumNorm = normalizeDatum(datum);

    const result = await session.executeWrite(tx =>
      tx.run(
        `
        CREATE (u:Utakmica {
          datum: $datum,
          kolo: $kolo,
          stadion: $stadion,
          broj_gledatelja: $broj_gledatelja
        })
        WITH u
        MATCH (d:Tim {naziv: $domacin_naziv})
        MATCH (gost:Tim {naziv: $gost_naziv})
        MERGE (d)-[:DOMACIN]->(u)
        MERGE (gost)-[:GOST]->(u)
        RETURN u
        `,
        {
          datum: datumNorm,
          kolo: toNeoIntOrNull(kolo),
          stadion: stadion || null,
          broj_gledatelja: toNeoIntOrNull(broj_gledatelja),
          domacin_naziv,
          gost_naziv
        }
      )
    );

    if (!result.records || result.records.length === 0) {
      return res.status(500).json({ ok: false, message: 'Neo4j nije vratio kreirani čvor.' });
    }

    const utakmica = formatNode(result.records[0].get('u'));

    res.status(201).json({
      ok: true,
      message: 'Utakmica uspješno kreirana',
      utakmica
    });

  } catch (err) {
    console.error('Greška pri kreiranju utakmice:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   READ ALL
   GET /api/utakmica
========================================================= */
router.get('/', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.READ });

  try {
    const result = await session.executeRead(tx =>
      tx.run(
        `
        MATCH (u:Utakmica)
        OPTIONAL MATCH (d:Tim)-[:DOMACIN]->(u)
        OPTIONAL MATCH (gost:Tim)-[:GOST]->(u)
        RETURN u, d, gost
        ORDER BY u.datum DESC
        `
      )
    );

    const utakmice = result.records.map(r => {
      const u = formatNode(r.get('u'));
      const d = r.get('d');
      const g = r.get('gost');

      return {
        ...u,
        domacin_naziv: d ? d.properties.naziv : null,
        gost_naziv: g ? g.properties.naziv : null
      };
    });

    res.json({
      ok: true,
      count: utakmice.length,
      utakmice
    });

  } catch (err) {
    console.error('Greška pri dohvaćanju utakmica:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   READ ONE
   GET /api/utakmica/:id
========================================================= */
router.get('/:id', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.READ });
  const { id } = req.params;

  try {
    const result = await session.executeRead(tx =>
      tx.run(
        `
        MATCH (u:Utakmica)
        WHERE elementId(u) = $id
        OPTIONAL MATCH (d:Tim)-[:DOMACIN]->(u)
        OPTIONAL MATCH (gost:Tim)-[:GOST]->(u)
        RETURN u, d, gost
        `,
        { id }
      )
    );

    if (!result.records || result.records.length === 0) {
      return res.status(404).json({ ok: false, message: 'Utakmica nije pronađena' });
    }

    const u = formatNode(result.records[0].get('u'));
    const d = result.records[0].get('d');
    const g = result.records[0].get('gost');

    res.json({
      ok: true,
      utakmica: {
        ...u,
        domacin_naziv: d ? d.properties.naziv : null,
        gost_naziv: g ? g.properties.naziv : null
      }
    });

  } catch (err) {
    console.error('Greška pri dohvaćanju utakmice:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   UPDATE
   PUT /api/utakmica/:id
   Možeš mijenjati samo broj_gledatelja bez diranja veza
========================================================= */
router.put('/:id', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.WRITE });
  const { id } = req.params;

  try {
    const { datum, kolo, stadion, broj_gledatelja, domacin_naziv, gost_naziv } = req.body;

    const check = await session.executeRead(tx =>
      tx.run(
        `MATCH (u:Utakmica) WHERE elementId(u) = $id RETURN u`,
        { id }
      )
    );

    if (!check.records || check.records.length === 0) {
      return res.status(404).json({ ok: false, message: 'Utakmica nije pronađena' });
    }

    const props = {};
    if (datum !== undefined) props.datum = normalizeDatum(datum);
    if (kolo !== undefined) props.kolo = toNeoIntOrNull(kolo);
    if (stadion !== undefined) props.stadion = stadion;
    if (broj_gledatelja !== undefined) props.broj_gledatelja = toNeoIntOrNull(broj_gledatelja);

    // Veze diramo samo ako su oba tima zadana i nisu prazna
    const wantsTeamsChange = !!(domacin_naziv && gost_naziv);

    const result = await session.executeWrite(tx =>
  tx.run(
    `
MATCH (u:Utakmica)
WHERE elementId(u) = $id
SET u += $props
WITH u
CALL {
  WITH u
  OPTIONAL MATCH (dNew:Tim {naziv: $domacin_naziv})
  OPTIONAL MATCH (gNew:Tim {naziv: $gost_naziv})
  WITH u, dNew, gNew
  WHERE dNew IS NOT NULL AND gNew IS NOT NULL

  OPTIONAL MATCH (:Tim)-[rd:DOMACIN]->(u)
  DELETE rd
  WITH u, dNew, gNew

  OPTIONAL MATCH (:Tim)-[rg:GOST]->(u)
  DELETE rg
  WITH u, dNew, gNew

  MERGE (dNew)-[:DOMACIN]->(u)
  MERGE (gNew)-[:GOST]->(u)

  RETURN 1 AS changed
}
RETURN u
`,
    {
      id,
      props,
      domacin_naziv: domacin_naziv || null,
      gost_naziv: gost_naziv || null
    }
  )
);



    if (!result.records || result.records.length === 0) {
      return res.json({ ok: true, message: 'Utakmica ažurirana (bez vraćenog čvora).' });
    }

    const utakmica = formatNode(result.records[0].get('u'));

    res.json({
      ok: true,
      message: 'Utakmica uspješno ažurirana',
      utakmica
    });

  } catch (err) {
    console.error('Greška pri ažuriranju utakmice:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

/* =========================================================
   DELETE
   DELETE /api/utakmica/:id
========================================================= */
router.delete('/:id', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.WRITE });
  const { id } = req.params;

  try {
    const check = await session.executeRead(tx =>
      tx.run(
        `MATCH (u:Utakmica) WHERE elementId(u) = $id RETURN u`,
        { id }
      )
    );

    if (!check.records || check.records.length === 0) {
      return res.status(404).json({ ok: false, message: 'Utakmica nije pronađena' });
    }

    await session.executeWrite(tx =>
      tx.run(
        `MATCH (u:Utakmica) WHERE elementId(u) = $id DETACH DELETE u`,
        { id }
      )
    );

    res.json({ ok: true, message: 'Utakmica uspješno obrisana' });

  } catch (err) {
    console.error('Greška pri brisanju utakmice:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
