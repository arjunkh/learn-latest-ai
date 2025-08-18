// scripts/utils/shortId.mjs
// Generate a short ID from title

export function generateShortId(title) {
  // Simple approach: take first letters of main words
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .split(' ')
    .filter(word => word.length > 2); // Skip small words
  
  if (words.length >= 2) {
    // Take first 2-3 significant words' first letters
    return words
      .slice(0, 3)
      .map(w => w[0])
      .join('') + 
      Math.random().toString(36).substr(2, 3); // Add random suffix
  }
  
  // Fallback: use first 5 chars + random
  return title.toLowerCase().substr(0, 5).replace(/[^a-z]/g, '') + 
         Math.random().toString(36).substr(2, 3);
}

// Examples:
// "GPT-5 System Card" → "gsc7x2"
// "DeepSeek Chinese Startup" → "dcs9k1"
// "AI Brainrot is Real" → "abr3m4"
