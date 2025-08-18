import fs from 'fs';
import { generateShortId } from './utils/shortId.mjs';

// Read current items.json
const data = JSON.parse(fs.readFileSync('public/data/items.json', 'utf8'));

// Handle both formats: array or object with articles
const items = Array.isArray(data) ? data : (data.articles || []);

// Add IDs to all articles
const updatedItems = items.map(item => ({
  ...item,
  id: item.id || generateShortId(item.title)
}));

// Save back in the same format
const output = Array.isArray(data) 
  ? updatedItems 
  : { ...data, articles: updatedItems };

fs.writeFileSync('public/data/items.json', JSON.stringify(output, null, 2));

console.log(`✅ Added IDs to ${updatedItems.length} articles`);
