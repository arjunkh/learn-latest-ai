import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import Parser from 'rss-parser';
import OpenAI from 'openai';

// TASK 1: Updated sources array - 7 sources, 4 items each = 28 total articles
const SOURCES = [
  // Existing sources
  { id: 'openai', name: 'OpenAI', rss: 'https://openai.com/blog/rss.xml', domain: 'openai.com' },
  { id: 'deepmind', name: 'Google DeepMind', rss: 'https://deepmind.google/discover/rss', domain: 'deepmind.google' },
  { id: 'verge-ai', name: 'The Verge (AI)', rss: 'https://www.theverge.com/rss/ai/index.xml', domain: 'theverge.com' },
  
  // New sources
  { id: 'towards-data-science', name: 'Towards Data Science', rss: 'https://towardsdatascience.com/feed', domain: 'towardsdatascience.com' },
  { id: 'ai-business', name: 'AI Business', rss: 'https://aibusiness.com/rss.xml', domain: 'aibusiness.com' },
  { id: 'reddit-chatgpt', name: 'Reddit ChatGPT', rss: 'https://www.reddit.com/r/ChatGPT/.rss', domain: 'reddit.com' },
  { id: 'ai-news', name: 'AI News', rss: 'https://www.artificialintelligence-news.com/feed/rss/', domain: 'artificialintelligence-news.com' }
];

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function contentHash({ title, source, published_at, body }) {
  return crypto.createHash('sha256').update(`${title.trim().toLowerCase()}||${source}||${published_at}||${body}`).digest('hex');
}

// TASK 3: Updated domain rules - auto-assign towardsdatascience.com to "Breakthroughs"
function ruleClassify({ domain, title, lede }) {
  const t = `${title} ${lede}`.toLowerCase();
  
  // Auto-assign "Breakthroughs" for technical/research sources
  if (['openai.com', 'deepmind.google', 'huggingface.co', 'towardsdatascience.com'].some(d => domain.includes(d))) {
    return 'capabilities_and_how';
  }
  
  // Keep flexible AI classification for varied content sources
  if (['launch', 'rollout', 'deploys', 'integrates', 'partners', 'available', 'beta'].some(w => t.includes(w))) {
    return 'in_action_real_world';
  }
  
  if (['policy', 'regulation', 'ethics', 'governance', 'risk', 'impact', 'jobs', 'economy', 'law'].some(w => t.includes(w))) {
    return 'trends_risks_outlook';
  }
  
  return null; // Will use AI classification
}

async function classifyTieBreaker(title, lede) {
  const prompt = `Classify this headline + first paragraph into exactly one category:
- capabilities_and_how
- in_action_real_world  
- trends_risks_outlook

Return ONLY the category id, nothing else.

Headline: ${title}
Dek: ${lede}`;

  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0
    });
    
    const content = (res.choices[0]?.message?.content || '').trim();
    
    // Validate the response is one of our expected categories
    const validCategories = ['capabilities_and_how', 'in_action_real_world', 'trends_risks_outlook'];
    if (validCategories.includes(content)) {
      return content;
    } else {
      console.warn(`Invalid category returned: ${content}, defaulting to capabilities_and_how`);
      return 'capabilities_and_how';
    }
  } catch (error) {
    console.error('Classification failed:', error.message);
    return 'capabilities_and_how'; // Default fallback
  }
}

async function summarizeArticle(fullText) {
  const prompt = `You are an expert AI news analyst. Create a high-quality summary that captures what makes this article unique and important.

Return ONLY a valid JSON object (no markdown formatting) with keys:

- speedrun: 60-80 words explaining the core news/development and its immediate significance
- why_it_matters: array of 2 bullets, each 20-30 words, focusing on specific implications and concrete impacts  
- lenses:
  - eli12: 3-4 sentences using simple language to explain what happened, why it's cool, and what it means for regular people
  - pm: 3-4 sentences covering: who will use this, what problems it solves, competitive advantages, and real business risks/opportunities
  - engineer: 3-4 sentences on: technical approach, architecture/methods, performance characteristics, and specific limitations or constraints

Focus on what makes THIS article unique. Avoid generic statements. Be specific about capabilities, use cases, and implications.

Article:
${fullText}`;

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3
  });
  
  let content = res.choices[0]?.message?.content || '{}';
  
  // Strip markdown code blocks if present
  content = content.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
  
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse JSON response:', content);
    // Return a fallback structure
    return {
      speedrun: "Unable to summarize article at this time.",
      why_it_matters: ["Summary unavailable", "Please check original source"],
      lenses: {
        eli12: "We couldn't process this article right now.",
        pm: "Article processing failed - check the original source for details.",
        engineer: "JSON parsing error - the AI response was malformed."
      }
    };
  }
}

// TASK 4: Updated main function with 4 items per source and sorting fix
async function main() {
  const parser = new Parser();
  const cacheDir = path.join(process.cwd(), 'data', 'cache');
  const publicData = path.join(process.cwd(), 'public', 'data', 'items.json');
  
  // Debug: Print current working directory and paths
  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`Cache directory: ${cacheDir}`);
  console.log(`Public data file: ${publicData}`);
  
  await fs.mkdir(cacheDir, { recursive: true });
  await fs.mkdir(path.dirname(publicData), { recursive: true });

  const existing = new Set(await fs.readdir(cacheDir).catch(() => []));
  const records = [];

  for (const s of SOURCES) {
    console.log(`Processing source: ${s.name}`);
    try {
      const feed = await parser.parseURL(s.rss);
      // Changed from 8 to 4 items per source
      for (const [index, item] of (feed.items || []).slice(0, 4).entries()) {
        try {
          const title = item.title || '';
          const url = item.link || '';
          const lede = (item.contentSnippet || item.content || '').slice(0, 400);
          const published_at = item.isoDate || item.pubDate || new Date().toISOString();
          const source = s.name;
          const body = (item.contentSnippet || item.content || title).toString();

          const hash = contentHash({ title, source, published_at, body });
          const cachePath = path.join(cacheDir, `${hash}.json`);

          let rec;
          if (existing.has(`${hash}.json`)) {
            rec = JSON.parse(await fs.readFile(cachePath, 'utf8'));
            console.log(`Using cached: ${title.slice(0, 50)}...`);
          } else {
            console.log(`Processing new article: ${title.slice(0, 50)}...`);
            let category = ruleClassify({ domain: s.domain, title, lede });
            if (!category) category = await classifyTieBreaker(title, lede);
            const sum = await summarizeArticle(`${title}

${lede}

${body}`);
            rec = {
              content_hash: hash, title, url, source, published_at,
              raw_excerpt: lede, raw_body: body,
              category, category_confidence: category ? 'medium':'low',
              speedrun: sum.speedrun,
              why_it_matters: sum.why_it_matters,
              lenses: sum.lenses,
              hype_meter: 3,
              model_meta: { model: 'gpt-4o-mini', prompt_version: 'v1.0' },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              processing_order: Date.now() + index // Add processing order for sorting tiebreaker
            };
            await fs.writeFile(cachePath, JSON.stringify(rec, null, 2));
            console.log(`Processed and cached: ${title.slice(0, 50)}...`);
          }

          records.push({
            id: hash,
            category: rec.category,
            title: rec.title,
            source: rec.source,
            url: rec.url,
            published_at: rec.published_at,
            speedrun: rec.speedrun,
            why_it_matters: rec.why_it_matters,
            lenses: rec.lenses,
            hype_meter: rec.hype_meter,
            processing_order: rec.processing_order || Date.now() // Fallback for existing records
          });
        } catch (itemError) {
          console.error(`Failed to process item "${item.title || 'unknown'}":`, itemError.message);
          // Continue with next item
        }
      }
    } catch (sourceError) {
      console.error(`Failed to process source ${s.name}:`, sourceError.message);
      // Continue with next source
    }
  }

  const cutoff = Date.now() - 14 * 24 * 3600 * 1000;
  const latest = records.filter(r => new Date(r.published_at).getTime() >= cutoff)
                        .sort((a, b) => {
                          // Primary sort: by published date (newest first)
                          const dateCompare = b.published_at.localeCompare(a.published_at);
                          if (dateCompare !== 0) return dateCompare;
                          
                          // Tiebreaker: by processing order (newest processed first)
                          return (b.processing_order || 0) - (a.processing_order || 0);
                        });

  // Debug: Show what we're about to write
  console.log(`About to write ${latest.length} items to: ${publicData}`);
  console.log(`Sample titles: ${latest.slice(0, 3).map(item => item.title).join(', ')}`);
  
  // Check if file exists before writing
  const fileExistsBefore = await fs.access(publicData).then(() => true).catch(() => false);
  console.log(`File exists before write: ${fileExistsBefore}`);
  
  // Write the file with metadata
  const output = {
    generated_at: new Date().toISOString(),
    total_articles: latest.length,
    articles: latest.map(({ processing_order, ...item }) => item) // Remove processing_order from public output
  };
  
  await fs.writeFile(publicData, JSON.stringify(output, null, 2));
  
  // Verify the file was written
  const fileExistsAfter = await fs.access(publicData).then(() => true).catch(() => false);
  console.log(`File exists after write: ${fileExistsAfter}`);
  
  // Read back and verify content
  try {
    const writtenContent = await fs.readFile(publicData, 'utf8');
    const parsedContent = JSON.parse(writtenContent);
    const itemCount = parsedContent.articles ? parsedContent.articles.length : parsedContent.length;
    console.log(`Verified: Written file contains ${itemCount} items`);
  } catch (verifyError) {
    console.error('Failed to verify written file:', verifyError.message);
  }
  
  console.log(`Built ${latest.length} items → public/data/items.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
