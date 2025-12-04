# Guide de Déploiement Vercel

Voici comment mettre en ligne votre application **Sales Weekly Pulse** gratuitement avec Vercel et Neon (pour la base de données).

## 1. Prérequis
- Un compte [GitHub](https://github.com/) (vous l'avez déjà).
- Un compte [Vercel](https://vercel.com/) (connectez-vous avec GitHub).
- Un compte [Neon](https://neon.tech/) (pour la base de données Postgres gratuite).

## 2. Créer la Base de Données (Neon)
1.  Allez sur [Neon Console](https://console.neon.tech/).
2.  Créez un nouveau projet (ex: `sales-pulse`).
3.  Une fois créé, copiez la **Connection String** (elle ressemble à `postgres://user:password@...`).
    *   Assurez-vous de copier la version "Pooled" si disponible, sinon la version standard ira très bien.

## 3. Déployer sur Vercel
1.  Allez sur votre [Dashboard Vercel](https://vercel.com/dashboard).
2.  Cliquez sur **"Add New..."** > **"Project"**.
3.  Importez votre repo GitHub : `weekly-pulse`.
4.  Dans la configuration du projet :
    *   **Framework Preset** : Next.js (devrait être détecté automatiquement).
    *   **Environment Variables** :
        *   Nom : `DATABASE_URL`
        *   Valeur : Collez la Connection String de Neon copiée à l'étape 2.
5.  Cliquez sur **"Deploy"**.

## 4. Finalisation (Schéma de Base de Données)
Une fois le déploiement terminé, votre application sera en ligne, mais la base de données sera vide. Il faut y "pousser" la structure des tables.

Le plus simple est de le faire depuis votre ordinateur (en local) :
1.  Ouvrez votre fichier `.env.local` dans le projet sur votre ordinateur.
2.  Ajoutez/Modifiez la ligne : `DATABASE_URL="votre_connection_string_neon"` (la même que sur Vercel).
3.  Ouvrez votre terminal dans le dossier du projet.
4.  Lancez la commande :
    ```bash
    npx drizzle-kit push
    ```
    *Cela va créer les tables `audits` et `sales_reps` dans votre base Neon.*

## 5. C'est fini !
Votre application est maintenant accessible via l'URL fournie par Vercel (ex: `https://weekly-pulse.vercel.app`).

### Note sur le mode "Hors Ligne"
Si la base de données n'est pas connectée ou inaccessible, l'application continuera de fonctionner en mode "dégradé" :
- Les audits seront sauvegardés **localement** dans votre navigateur.
- Le tableau de bord affichera ces données locales.
- Les commerciaux par défaut ("Thomas", "Julie") seront disponibles.
