# PARTSDESK — Guide de déploiement sur Vercel

## Structure du projet
```
partsdesk/
├── api/
│   └── check.js        ← Backend (vérifie si la pièce existe sur chaque site)
├── public/
│   └── index.html      ← Frontend (ta page de recherche)
├── package.json
├── vercel.json
└── README.md
```

---

## Étapes de déploiement

### 1. Créer le dépôt GitHub
1. Va sur [github.com](https://github.com) → **New repository**
2. Nom : `partsdesk`
3. Visibilité : **Private** (recommandé)
4. Clique **Create repository**

### 2. Uploader les fichiers
Sur la page de ton nouveau dépôt :
1. Clique **uploading an existing file**
2. Glisse-dépose **tous les fichiers** du dossier `partsdesk/` en respectant la structure
   - `api/check.js`
   - `public/index.html`
   - `package.json`
   - `vercel.json`
3. Clique **Commit changes**

### 3. Déployer sur Vercel
1. Va sur [vercel.com](https://vercel.com) → **Sign up with GitHub**
2. Clique **Add New Project**
3. Sélectionne ton dépôt `partsdesk`
4. Laisse tous les paramètres par défaut
5. Clique **Deploy**

### 4. C'est en ligne !
Vercel te donne une URL du type :
```
https://partsdesk-xxxx.vercel.app
```
Tu peux aussi configurer un domaine personnalisé dans les paramètres Vercel.

---

## Comment ça marche

1. Tu tapes un **part number** dans la page
2. Tu cliques **Vérifier les sites**
3. Le backend (`/api/check`) interroge chaque site en parallèle
4. Seuls les sites où la pièce **existe réellement** apparaissent avec un lien direct
5. Les sites sans résultat sont affichés en grisé

---

## Mise à jour
Pour modifier la page ou ajouter des sites :
- Édite les fichiers sur GitHub directement
- Vercel redéploie automatiquement en quelques secondes

---

## Ajouter un nouveau site
Dans `api/check.js`, ajoute un objet dans le tableau `SITES` :
```js
{
  id: 'monsite',
  name: 'MON SITE',
  desc: 'Description courte',
  buildUrl: (q) => `https://monsite.com/search?q=${encodeURIComponent(q)}`,
  checkUrl: (q) => `https://monsite.com/search?q=${encodeURIComponent(q)}`,
  hasResult: (body) => {
    return !body.includes('Aucun résultat') && body.includes('product');
  }
}
```
Puis ajoute le toggle correspondant dans `public/index.html`.
