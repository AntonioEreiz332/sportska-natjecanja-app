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
    }
  }
  
  props._id = node.identity ? node.identity.toNumber() : null;
  return props;
}

// ==================== CREATE ====================
router.post('/', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.WRITE });
  
  try {
    const { naziv, grad, stadion, kapacitet_stadiona, godina_osnivanja } = req.body;
    
    if (!naziv || !grad) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Naziv i grad su obavezna polja' 
      });
    }
    
    const result = await session.executeWrite(tx =>
      tx.run(
        `CREATE (t:Tim {
          naziv: $naziv,
          grad: $grad,
          stadion: $stadion,
          kapacitet_stadiona: $kapacitet_stadiona,
          godina_osnivanja: $godina_osnivanja
        }) RETURN t`,
        {
          naziv,
          grad,
          stadion: stadion || null,
          kapacitet_stadiona: kapacitet_stadiona != null ? neo4j.int(kapacitet_stadiona) : null,
          godina_osnivanja: godina_osnivanja != null ? neo4j.int(godina_osnivanja) : null
        }
      )
    );
    
    const node = result.records[0].get('t');
    res.status(201).json({ 
      ok: true, 
      message: 'Tim uspješno kreiran',
      tim: formatNode(node) 
    });
    
  } catch (err) {
    console.error('Greška pri kreiranju tima:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

// ==================== READ ALL ====================
router.get('/', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.READ });
  
  try {
    const result = await session.executeRead(tx =>
      tx.run('MATCH (t:Tim) RETURN t ORDER BY t.naziv')
    );
    
    const timovi = result.records.map(r => formatNode(r.get('t')));
    
    res.json({ 
      ok: true, 
      count: timovi.length,
      timovi 
    });
    
  } catch (err) {
    console.error('Greška pri dohvaćanju timova:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

// ==================== READ ONE ====================
router.get('/:naziv', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.READ });
  
  try {
    const { naziv } = req.params;
    
    const result = await session.executeRead(tx =>
      tx.run('MATCH (t:Tim {naziv: $naziv}) RETURN t', { naziv })
    );
    
    if (result.records.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Tim nije pronađen' 
      });
    }
    
    const tim = formatNode(result.records[0].get('t'));
    res.json({ ok: true, tim });
    
  } catch (err) {
    console.error('Greška pri dohvaćanju tima:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

// ==================== UPDATE ====================
router.put('/:naziv', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.WRITE });
  
  try {
    const { naziv } = req.params;
    const { novi_naziv, grad, stadion, kapacitet_stadiona, godina_osnivanja } = req.body;
    
    const checkResult = await session.executeRead(tx =>
      tx.run('MATCH (t:Tim {naziv: $naziv}) RETURN t', { naziv })
    );
    
    if (checkResult.records.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Tim nije pronađen' 
      });
    }
    
    const props = {};
    if (novi_naziv !== undefined) props.naziv = novi_naziv;
    if (grad !== undefined) props.grad = grad;
    if (stadion !== undefined) props.stadion = stadion;
    if (kapacitet_stadiona !== undefined) {
      props.kapacitet_stadiona = neo4j.int(kapacitet_stadiona);
    }
    if (godina_osnivanja !== undefined) {
      props.godina_osnivanja = neo4j.int(godina_osnivanja);
    }
    
    if (Object.keys(props).length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Nema podataka za ažuriranje' 
      });
    }
    
    const result = await session.executeWrite(tx =>
      tx.run(
        'MATCH (t:Tim {naziv: $naziv}) SET t += $props RETURN t',
        { naziv, props }
      )
    );
    
    const tim = formatNode(result.records[0].get('t'));
    res.json({ 
      ok: true, 
      message: 'Tim uspješno ažuriran',
      tim 
    });
    
  } catch (err) {
    console.error('Greška pri ažuriranju tima:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

// ==================== DELETE ====================
router.delete('/:naziv', async (req, res) => {
  const session = getSession({ defaultAccessMode: neo4j.session.WRITE });
  
  try {
    const { naziv } = req.params;
    
    const checkResult = await session.executeRead(tx =>
      tx.run('MATCH (t:Tim {naziv: $naziv}) RETURN t', { naziv })
    );
    
    if (checkResult.records.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Tim nije pronađen' 
      });
    }
    
    await session.executeWrite(tx =>
      tx.run('MATCH (t:Tim {naziv: $naziv}) DETACH DELETE t', { naziv })
    );
    
    res.json({ 
      ok: true, 
      message: 'Tim uspješno obrisan' 
    });
    
  } catch (err) {
    console.error('Greška pri brisanju tima:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;