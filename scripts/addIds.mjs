import fs from 'fs';
import { generateShortId } from './utils/shortId.mjs';

// Read current items.json
const data = JSON.parse(fs.readFileSync('public/data/items.json', 'utf8'));

// ADD share_id without touching existing id
const updatedArticles = data.articles.map(item => ({
  ...item,
  share_id: item.share_id || generateShortId(item.title)  // ADD new field
}));

// Save back with updated articles
const output = {
  ...data,
  articles: updatedArticles
};

fs.writeFileSync('public/data/items.json', JSON.stringify(output, null, 2));

console.log(`✅ Added share_ids to ${updatedArticles.length} articles`);
