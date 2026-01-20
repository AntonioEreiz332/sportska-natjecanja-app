const neo4j = require('neo4j-driver');

let driver;

function initDriver() {
  if (!driver) {
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !user || !password) {
      throw new Error('NEO4J_URI, NEO4J_USER i NEO4J_PASSWORD moraju biti postavljeni u .env');
    }

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    console.log('Neo4j driver inicijaliziran');
  }
  return driver;
}

function getSession({ defaultAccessMode = neo4j.session.WRITE, database = process.env.NEO4J_DATABASE } = {}) {
  const drv = initDriver();
  return drv.session({ defaultAccessMode, database });
}

async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('Neo4j driver zatvoren');
  }
}

module.exports = { initDriver, getSession, closeDriver };