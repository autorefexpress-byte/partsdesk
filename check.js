const fetch = require('node-fetch');

const SITES = [
  {
    id: 'autodoc',
    name: 'AUTODOC',
    desc: 'Aftermarket — prix bas',
    buildUrl: (q) => `https://www.autodoc.fr/recherche?searchType=article&searchValue=${encodeURIComponent(q)}`,
    // API JSON interne d'Autodoc — bien plus fiable que le scraping HTML
    checkUrl: (q) => `https://www.autodoc.fr/api/catalog/fr/search?query=${encodeURIComponent(q)}&page=1&itemsPerPage=5`,
    hasResult: (body, status) => {
      if (status === 404 || status === 400) return false;
      try {
        const json = JSON.parse(body);
        if (json.totalCount !== undefined) return json.totalCount > 0;
        if (json.total     !== undefined) return json.total > 0;
        if (Array.isArray(json.items))    return json.items.length > 0;
        if (Array.isArray(json.products)) return json.products.length > 0;
        return body.length > 100 &&
               !body.includes('"totalCount":0') &&
               !body.includes('"total":0');
      } catch {
        return body.includes('product-card') ||
               body.includes('search-result') ||
               body.includes('js-catalog-item');
      }
    }
  },
  {
    id: 'ebay',
    name: 'EBAY',
    desc: 'Neuf & occasion',
    buildUrl: (q) => `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(q)}+piece+auto&_sacat=6030`,
    checkUrl: (q) => `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(q)}+piece+auto&_sacat=6030`,
    hasResult: (body) => {
      if (body.includes('srp-river-results--EMPTY')) return false;
      if (body.includes('0 r&#233;sultats') || body.includes('0 résultats')) return false;
      return body.includes('s-item__title') || body.includes('s-item__price');
    }
  },
  {
    id: 'partsouq',
    name: 'PARTSOUQ',
    desc: 'OEM — Moyen-Orient',
    buildUrl: (q) => `https://partsouq.com/en/search/all?q=${encodeURIComponent(q)}`,
    checkUrl: (q) => `https://partsouq.com/en/search/all?q=${encodeURIComponent(q)}`,
    hasResult: (body) => {
      if (body.includes('No results found') || body.includes('no-results-found')) return false;
      return body.includes('part-number') ||
             body.includes('catalog-item') ||
             body.includes('search-item');
    }
  },
  {
    id: 'oscaro',
    name: 'OSCARO',
    desc: 'Leader FR pièces détachées',
    buildUrl: (q) => `https://www.oscaro.com/search#search=${encodeURIComponent(q)}`,
    checkUrl: (q) => `https://www.oscaro.com/search?search=${encodeURIComponent(q)}`,
    hasResult: (body) => {
      if (body.includes('Aucun r&#233;sultat') || body.includes('Aucun résultat')) return false;
      if (body.includes('"nbHits":0') || body.includes('"count":0')) return false;
      return body.includes('product-card') ||
             body.includes('js-product') ||
             body.includes('oscaro-product');
    }
  },
  {
    id: 'pieceauto24',
    name: 'PIECE-AUTO24',
    desc: 'Pièces FR — livraison rapide',
    buildUrl: (q) => `https://www.piece-auto24.fr/search?search=${encodeURIComponent(q)}`,
    checkUrl: (q) => `https://www.piece-auto24.fr/search?search=${encodeURIComponent(q)}`,
    hasResult: (body) => {
      if (body.includes('Aucun produit') || body.includes('0 produit')) return false;
      return body.includes('product-miniature') ||
             body.includes('product-title') ||
             body.includes('js-product-list');
    }
  },
  {
    id: 'megazip',
    name: 'MEGAZIP',
    desc: 'OEM japonaises & autres',
    buildUrl: (q) => `https://www.megazip.net/zapchasti-dlya-avtomobilej?article=${encodeURIComponent(q)}`,
    checkUrl: (q) => `https://www.megazip.net/zapchasti-dlya-avtomobilej?article=${encodeURIComponent(q)}`,
    hasResult: (body) => {
      if (body.includes('Nothing found') || body.includes('no results')) return false;
      return body.includes('catalog-item') ||
             body.includes('part-row') ||
             body.includes('search-result-item');
    }
  },
  {
    id: 'rockauto',
    name: 'ROCKAUTO',
    desc: 'USA — toutes marques',
    buildUrl: (q) => `https://www.rockauto.com/en/partsearch/?q=${encodeURIComponent(q)}`,
    checkUrl: (q) => `https://www.rockauto.com/en/partsearch/?q=${encodeURIComponent(q)}`,
    hasResult: (body) => {
      if (body.includes('No parts found') || body.includes('partnotfound')) return false;
      return body.includes('[listing,') ||
             body.includes('ra-partnum') ||
             body.includes('jspartinfo');
    }
  },
  {
    id: 'alibaba',
    name: 'ALIBABA',
    desc: 'Fournisseurs Chine — gros',
    buildUrl: (q) => `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(q)}&IndexArea=product_en`,
    checkUrl: (q) => `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(q)}&IndexArea=product_en`,
    hasResult: (body) => {
      if (body.includes('Sorry, no results') || body.includes('0 products')) return false;
      if (body.includes('"total":0') || body.includes('"count":"0"')) return false;
      return body.includes('organic-list-item') ||
             body.includes('J-product-item') ||
             body.includes('J-offer-wrapper') ||
             body.includes('list-no-v2-outter') ||
             body.includes('m-gallery-product-item');
    }
  }
];

async function checkSite(site, partNumber) {
  try {
    const response = await fetch(site.checkUrl(partNumber), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/json,*/*;q=0.9',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000,
      redirect: 'follow'
    });

    const body = await response.text();
    const found = site.hasResult(body, response.status);

    return {
      found,
      url: site.buildUrl(partNumber),
      name: site.name,
      desc: site.desc,
      id: site.id
    };
  } catch (err) {
    return { found: false, error: err.message, id: site.id, name: site.name, desc: site.desc };
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, sites } = req.query;
  if (!q || q.trim().length < 3) {
    return res.status(400).json({ error: 'Référence trop courte (min 3 caractères)' });
  }

  const partNumber = q.trim().toUpperCase();
  const requestedSites = sites ? sites.split(',') : SITES.map(s => s.id);
  const sitesToCheck = SITES.filter(s => requestedSites.includes(s.id));

  const results = await Promise.allSettled(
    sitesToCheck.map(site => checkSite(site, partNumber))
  );

  const found = [];
  const notFound = [];

  results.forEach((result, i) => {
    const site = sitesToCheck[i];
    if (result.status === 'fulfilled' && result.value.found) {
      found.push(result.value);
    } else {
      notFound.push({
        id: site.id,
        name: site.name,
        desc: site.desc,
        error: result.value?.error || null
      });
    }
  });

  return res.status(200).json({ partNumber, found, notFound, total: found.length });
};
