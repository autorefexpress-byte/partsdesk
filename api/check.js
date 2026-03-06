// Tous les sites sont retournés comme liens directs
// La vérification côté serveur est bloquée par les anti-bots des sites e-commerce

const ALL_SITES = [
  { id: 'autodoc',    name: 'AUTO-DOC',     desc: 'Aftermarket — prix bas',           buildUrl: (q) => `https://www.auto-doc.fr/recherche?searchType=article&searchValue=${encodeURIComponent(q)}` },
  { id: 'ebay',       name: 'EBAY',         desc: 'Neuf & occasion',                  buildUrl: (q) => `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(q)}+piece+auto&_sacat=6030` },
  { id: 'partsouq',   name: 'PARTSOUQ',     desc: 'OEM — Moyen-Orient',               buildUrl: (q) => `https://partsouq.com/en/search/all?q=${encodeURIComponent(q)}` },
  { id: 'oscaro',     name: 'OSCARO',       desc: 'Leader FR pièces détachées',       buildUrl: (q) => `https://www.oscaro.com/search#search=${encodeURIComponent(q)}` },
  { id: 'pieceauto24',name: 'PIECE-AUTO24', desc: 'Pièces FR — livraison rapide',     buildUrl: (q) => `https://www.piece-auto24.fr/search?search=${encodeURIComponent(q)}` },
  { id: 'megazip',    name: 'MEGAZIP',      desc: 'OEM japonaises & autres',          buildUrl: (q) => `https://www.megazip.net/zapchasti-dlya-avtomobilej?article=${encodeURIComponent(q)}` },
  { id: 'rockauto',   name: 'ROCKAUTO',     desc: 'USA — toutes marques',             buildUrl: (q) => `https://www.rockauto.com/en/partsearch/?q=${encodeURIComponent(q)}` },
  { id: 'alibaba',    name: 'ALIBABA',      desc: 'Fournisseurs Chine — gros',        buildUrl: (q) => `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(q)}&IndexArea=product_en` },
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, sites } = req.query;
  if (!q || q.trim().length < 3) return res.status(400).json({ error: 'Référence trop courte (min 3 caractères)' });

  const partNumber = q.trim().toUpperCase();
  const requestedSites = sites ? sites.split(',') : ALL_SITES.map(s => s.id);
  const links = ALL_SITES
    .filter(s => requestedSites.includes(s.id))
    .map(s => ({ id: s.id, name: s.name, desc: s.desc, url: s.buildUrl(partNumber) }));

  return res.status(200).json({ partNumber, links, total: links.length });
};
