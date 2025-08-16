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

// PHASE 2: Create monthly organized files
async function createMonthlyFiles(allArticles, publicDataPath) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Group articles by month
  const articlesByMonth = {};
  const monthsIndex = [];
  
  for (const article of allArticles) {
    const date = new Date(article.published_at);
    const year = date.getFullYear();
    const monthNum = date.getMonth();
    const monthName = monthNames[monthNum];
    
    // Create filename like "December_2024_News"
    const monthKey = `${monthName}_${year}_News`;
    const monthDisplay = `${monthName} ${year}`;
    
    if (!articlesByMonth[monthKey]) {
      articlesByMonth[monthKey] = {
        month: monthDisplay,
        year: year,
        month_num: monthNum + 1, // 1-12 for sorting
        filename: `${monthKey}.json`,
        articles: []
      };
    }
    
    articlesByMonth[monthKey].articles.push(article);
  }
  
  // Write each month's file
  const dataDir = path.dirname(publicDataPath);
  console.log('\nCreating monthly files:');
  
  for (const [monthKey, monthData] of Object.entries(articlesByMonth)) {
    const monthFile = path.join(dataDir, monthData.filename);
    
    // Sort articles within month (newest first)
    monthData.articles.sort((a, b) => {
      const dateCompare = new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      if (dateCompare !== 0) return dateCompare;
      return (b.processing_order || 0) - (a.processing_order || 0);
    });
    
    const monthOutput = {
      month: monthData.month,
      year: monthData.year,
      total: monthData.articles.length,
      generated_at: new Date().toISOString(),
      articles: monthData.articles.map(({ processing_order, ...item }) => item)
    };
    
    await fs.writeFile(monthFile, JSON.stringify(monthOutput, null, 2));
    console.log(`  ✓ ${monthData.filename}: ${monthData.articles.length} articles`);
    
    // Add to index
    monthsIndex.push({
      month: monthData.month,
      year: monthData.year,
      month_num: monthData.month_num,
      filename: monthData.filename,
      article_count: monthData.articles.length
    });
  }
  
  // Sort index by date (newest first)
  monthsIndex.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month_num - a.month_num;
  });
  
  // Write metadata file
  const metadataFile = path.join(dataDir, 'metadata.json');
  const metadata = {
    generated_at: new Date().toISOString(),
    total_articles: allArticles.length,
    total_months: monthsIndex.length,
    months: monthsIndex
  };
  
  await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
  console.log(`  ✓ metadata.json: ${monthsIndex.length} months indexed`);
}

// PHASE 1 IMPLEMENTATION: Load all cached articles first
async function loadAllCachedArticles(cacheDir) {
  const records = [];
  
  try {
    const cacheFiles = await fs.readdir(cacheDir).catch(() => []);
    console.log(`Found ${cacheFiles.length} cached articles`);
    
    for (const filename of cacheFiles) {
      if (!filename.endsWith('.json')) continue;
      
      try {
        const filePath = path.join(cacheDir, filename);
        const cached = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        // Build record from cached data
        records.push({
          id: cached.content_hash,
          category: cached.category,
          title: cached.title,
          source: cached.source,
          url: cached.url,
          published_at: cached.published_at,
          speedrun: cached.speedrun,
          why_it_matters: cached.why_it_matters,
          lenses: cached.lenses,
          hype_meter: cached.hype_meter,
          processing_order: cached.processing_order || Date.now()
        });
      } catch (e) {
        console.error(`Failed to load cache file ${filename}:`, e.message);
      }
    }
    
    console.log(`Successfully loaded ${records.length} articles from cache`);
  } catch (error) {
    console.error('Error loading cached articles:', error.message);
  }
  
  return records;
}

// Updated main function with accumulation logic
async function main() {
  const parser = new Parser();
  const cacheDir = path.join(process.cwd(), 'data', 'cache');
  const publicData = path.join(process.cwd(), 'public', 'data', 'items.json');
  
  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`Cache directory: ${cacheDir}`);
  console.log(`Public data file: ${publicData}`);
  
  await fs.mkdir(cacheDir, { recursive: true });
  await fs.mkdir(path.dirname(publicData), { recursive: true });

  // PHASE 1: Load ALL cached articles first (no time limit!)
  const records = await loadAllCachedArticles(cacheDir);
  const existingHashes = new Set(records.map(r => r.id));
  console.log(`Starting with ${records.length} existing articles`);
  
  // Keep track of cache files for checking
  const cacheFiles = new Set(await fs.readdir(cacheDir).catch(() => []));

  // Process RSS feeds for new articles
  let newArticlesCount = 0;
  for (const s of SOURCES) {
    console.log(`Processing source: ${s.name}`);
    try {
      const feed = await parser.parseURL(s.rss);
      // Take up to 4 items per source (could be 0-4)
      const itemsToProcess = (feed.items || []).slice(0, 4);
      console.log(`  Found ${itemsToProcess.length} items in RSS feed`);
      
      for (const [index, item] of itemsToProcess.entries()) {
        try {
          const title = item.title || '';
          const url = item.link || '';
          const lede = (item.contentSnippet || item.content || '').slice(0, 400);
          const published_at = item.isoDate || item.pubDate || new Date().toISOString();
          const source = s.name;
          const body = (item.contentSnippet || item.content || title).toString();

          const hash = contentHash({ title, source, published_at, body });
          const cachePath = path.join(cacheDir, `${hash}.json`);

          // Skip if already in our loaded records
          if (existingHashes.has(hash)) {
            console.log(`  Already have: ${title.slice(0, 50)}...`);
            continue;
          }

          // Check if it's in cache but wasn't loaded (edge case)
          if (cacheFiles.has(`${hash}.json`)) {
            const cached = JSON.parse(await fs.readFile(cachePath, 'utf8'));
            records.push({
              id: hash,
              category: cached.category,
              title: cached.title,
              source: cached.source,
              url: cached.url,
              published_at: cached.published_at,
              speedrun: cached.speedrun,
              why_it_matters: cached.why_it_matters,
              lenses: cached.lenses,
              hype_meter: cached.hype_meter,
              processing_order: cached.processing_order || Date.now()
            });
            console.log(`  Loaded from cache: ${title.slice(0, 50)}...`);
          } else {
            // Process new article
            console.log(`  Processing NEW article: ${title.slice(0, 50)}...`);
            let category = ruleClassify({ domain: s.domain, title, lede });
            if (!category) category = await classifyTieBreaker(title, lede);
            const sum = await summarizeArticle(`${title}\n\n${lede}\n\n${body}`);
            
            const articleData = {
              content_hash: hash,
              title,
              url,
              source,
              published_at,
              raw_excerpt: lede,
              raw_body: body,
              category,
              category_confidence: category ? 'medium' : 'low',
              speedrun: sum.speedrun,
              why_it_matters: sum.why_it_matters,
              lenses: sum.lenses,
              hype_meter: 3,
              model_meta: { model: 'gpt-4o-mini', prompt_version: 'v1.0' },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              processing_order: Date.now() + index
            };
            
            // Save to cache
            await fs.writeFile(cachePath, JSON.stringify(articleData, null, 2));
            
            // Add to records
            records.push({
              id: hash,
              category: articleData.category,
              title: articleData.title,
              source: articleData.source,
              url: articleData.url,
              published_at: articleData.published_at,
              speedrun: articleData.speedrun,
              why_it_matters: articleData.why_it_matters,
              lenses: articleData.lenses,
              hype_meter: articleData.hype_meter,
              processing_order: articleData.processing_order
            });
            
            newArticlesCount++;
            console.log(`  ✓ Processed and cached new article`);
          }
        } catch (itemError) {
          console.error(`  ✗ Failed to process item "${item.title || 'unknown'}":`, itemError.message);
        }
      }
    } catch (sourceError) {
      console.error(`Failed to process source ${s.name}:`, sourceError.message);
    }
  }

  console.log(`\nAdded ${newArticlesCount} new articles`);
  console.log(`Total articles in system: ${records.length}`);

  // Sort all records by published date (newest first)
  const sortedRecords = records.sort((a, b) => {
    const dateCompare = new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    if (dateCompare !== 0) return dateCompare;
    return (b.processing_order || 0) - (a.processing_order || 0);
  });

  // PHASE 2: Create monthly files
  await createMonthlyFiles(sortedRecords, publicData);

  // For backward compatibility - output last 30 days to items.json
  const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
  const recentArticles = sortedRecords.filter(r => 
    new Date(r.published_at).getTime() >= thirtyDaysAgo
  );

  // Also create items-latest.json (same as items.json for now)
  const latestOutput = {
    generated_at: new Date().toISOString(),
    total_articles: recentArticles.length,
    total_in_cache: records.length,
    articles: recentArticles.map(({ processing_order, ...item }) => item)
  };
  
  // Write both files for compatibility
  await fs.writeFile(publicData, JSON.stringify(latestOutput, null, 2));
  await fs.writeFile(
    path.join(path.dirname(publicData), 'items-latest.json'),
    JSON.stringify(latestOutput, null, 2)
  );
  
  // Verify the files were written
  try {
    const writtenContent = await fs.readFile(publicData, 'utf8');
    const parsedContent = JSON.parse(writtenContent);
    console.log(`\n✓ Written ${parsedContent.articles.length} recent articles to items.json`);
    console.log(`✓ Total cached articles: ${parsedContent.total_in_cache}`);
  } catch (verifyError) {
    console.error('Failed to verify written file:', verifyError.message);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
