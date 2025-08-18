import fs from 'fs';
import { generateShortId } from './utils/shortId.mjs';

// Read current items.json
const items = JSON.parse(fs.readFileSync('public/data/items.json', 'utf8'));

// Add IDs to all articles
const updatedItems = items.map(item => ({
  ...item,
  id: item.id || generateShortId(item.title)
}));

// Save back
fs.writeFileSync('public/data/items.json', JSON.stringify(updatedItems, null, 2));

console.log(`✅ Added IDs to ${updatedItems.length} articles`);
