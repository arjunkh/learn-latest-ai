import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import Parser from 'rss-parser';
import OpenAI from 'openai';
import { generateShortId } from './utils/shortId.mjs';

// SOURCES array - UNCHANGED
const SOURCES = [
  { id: 'openai', name: 'OpenAI', rss: 'https://openai.com/blog/rss.xml', domain: 'openai.com' },
  { id: 'mit-tech', name: 'MIT Technology Review', rss: 'https://www.technologyreview.com/feed/', domain: 'technologyreview.com' },
  { id: 'arxiv-ai', name: 'ArXiv AI', rss: 'http://arxiv.org/rss/cs.AI', domain: 'arxiv.org' },
  { id: 'verge-ai', name: 'The Verge (AI)', rss: 'https://www.theverge.com/rss/ai/index.xml', domain: 'theverge.com' },
  { id: 'towards-data-science', name: 'Towards Data Science', rss: 'https://towardsdatascience.com/feed', domain: 'towardsdatascience.com' },
  { id: 'ai-business', name: 'AI Business', rss: 'https://aibusiness.com/rss.xml', domain: 'aibusiness.com' },
  { id: 'venturebeat', name: 'VentureBeat', rss: 'https://feeds.feedburner.com/venturebeat/SZYF', domain: 'venturebeat.com' },
  { id: 'ai-news', name: 'AI News', rss: 'https://www.artificialintelligence-news.com/feed/rss/', domain: 'artificialintelligence-news.com' }
];

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function contentHash({ title, source, published_at, body }) {
  return crypto.createHash('sha256').update(`${title.trim().toLowerCase()}||${source}||${published_at}||${body}`).digest('hex');
}

// CHANGED: Enhanced rule classification with smarter patterns
function ruleClassify({ domain, title, lede }) {
  const t = `${title} ${lede}`.toLowerCase();
  
  // Research/breakthrough indicators (stronger signals)
  if (['arxiv.org', 'openai.com', 'deepmind', 'anthropic'].some(d => domain.includes(d))) {
    if (!t.includes('available') && !t.includes('launches')) {
      return 'capabilities_and_how';
    }
  }
  
  // Deployment indicators (more specific)
  const deploymentWords = ['launches', 'rolls out', 'now available', 'introduces', 
                           'partners with', 'integrates', 'implements', 'deploys'];
  if (deploymentWords.some(w => t.includes(w)) && t.includes('customers')) {
    return 'in_action_real_world';
  }
  
  // Trend/risk indicators (broader capture)
  const trendWords = ['regulation', 'lawsuit', 'layoffs', 'raises', 'funding',
                      'acquisition', 'policy', 'ethics', 'jobs', 'future'];
  if (trendWords.some(w => t.includes(w))) {
    return 'trends_risks_outlook';
  }
  
  return null; // Use AI classification
}

// CHANGED: Updated classification prompt with POSSIBLE/HAPPENING/COMING logic
async function classifyTieBreaker(title, lede) {
  const prompt = `Classify this article into exactly one category:
- capabilities_and_how (technical breakthroughs, new models, research)
- in_action_real_world (deployments, integrations, real implementations)
- trends_risks_outlook (industry shifts, regulations, societal impacts)

Think: Is this about what's POSSIBLE (capabilities), what's HAPPENING (action), or what's COMING (trends)?

Return ONLY the category id.

Headline: ${title}
First paragraph: ${lede}`;

  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0  // CHANGED: Confirmed at 0 for deterministic classification
    });
    
    const content = (res.choices[0]?.message?.content || '').trim();
    
    const validCategories = ['capabilities_and_how', 'in_action_real_world', 'trends_risks_outlook'];
    if (validCategories.includes(content)) {
      return content;
    } else {
      console.warn(`Invalid category returned: ${content}, defaulting to capabilities_and_how`);
      return 'capabilities_and_how';
    }
  } catch (error) {
    console.error('Classification failed:', error.message);
    return 'capabilities_and_how';
  }
}

// NEW: Headline rewriter function
async function rewriteHeadline(title) {
  const prompt = `Rewrite this headline to maximize clarity + curiosity in under 12 words.

Rules:
- Clearly signal what the article is about
- Add intrigue or a surprising hook without exaggeration
- Avoid clickbait clichés ("You won't believe", "shocking")
- If numbers/metrics/timeframes are in the article, prefer including them
- Output ONLY the improved headline

Original Headline: ${title}`;

  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6  // CHANGED: As specified for creative headlines
    });
    
    const newHeadline = (res.choices[0]?.message?.content || '').trim();
    
    // Validate it's reasonable (not empty, not too long)
    if (newHeadline && newHeadline.split(' ').length <= 12) {
      return newHeadline;
    } else {
      console.warn('Headline rewrite failed validation, using original');
      return title;
    }
  } catch (error) {
    console.error('Headline rewrite failed:', error.message);
    return title; // Fallback to original
  }
}

// CHANGED: Complete rewrite with critical analyst prompt
async function summarizeArticle(fullText) {
  const prompt = `You are a critical AI analyst who verifies claims and provides actionable intelligence.

Analyze this article with healthy skepticism. Look for:
- What's actually proven vs what's only claimed
- Hidden limitations or caveats (if none given, write "not specified")
- The gap between headline hype and article reality
- Who benefits most from this development

Return ONLY a valid JSON object with these exact keys:

- speedrun: 70-90 words that capture:
  * The core development (what actually happened)
  * The VERIFIED scope (not the claimed scope)
  * One critical caveat or limitation (use "not specified" if missing)
  * Why this matters NOW specifically
  
- why_it_matters: Array of exactly 2 bullets (20-30 words each):
  * First bullet: Immediate practical impact with specific affected group
  * Second bullet: Strategic implication or market dynamic shift
  * Include concrete metrics/timeframes when mentioned
  * Avoid vague phrases like "could transform"

- lenses:
  - eli12: 3-4 sentences that:
    * Explain what happened using a simple analogy
    * Identify who this helps/hurts in plain terms
    * Add one "but watch out for..." warning
    * End with why a young person should care
    
  - pm: 3-4 sentences covering:
    * One SPECIFIC use case enabled/blocked
    * Clear competitive edge (with company names if mentioned)
    * Hidden cost/dependency not in headline
    * One concrete next step a PM should take
    
  - engineer: 3-4 sentences analyzing:
    * The technical approach (use only details present; otherwise "not specified")
    * One key limitation/bottleneck
    * Compare to an existing solution with metrics if available
    * Flag one technical red flag or unaddressed challenge

Article:
${fullText}`;

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4  // CHANGED: Increased from 0.3 to 0.4 as specified
  });
  
  let content = res.choices[0]?.message?.content || '{}';
  
  // Strip markdown code blocks if present
  content = content.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
  
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse JSON response:', content);
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

// NEW: Dynamic hype meter calculation
function calculateHypeMeter(article, summary) {
  const title = article.title.toLowerCase();
  const content = JSON.stringify(summary).toLowerCase();
  
  // Start at neutral
  let hypeScore = 0;
  let evidenceScore = 0;
  
  // HYPE SIGNALS (things that inflate expectations)
  const hypeWords = {
    // Superlatives (very hyped)
    'revolutionary': 3,
    'breakthrough': 3,
    'game-changing': 3,
    'paradigm': 3,
    
    // Strong claims (moderately hyped)
    'transform': 2,
    'disrupt': 2,
    'unprecedented': 2,
    'exclusive': 2,
    
    // Mild enthusiasm (slightly hyped)
    'first': 1,
    'new': 1,
    'novel': 1,
    'cutting-edge': 1
  };
  
  // EVIDENCE SIGNALS (things that ground claims)
  const evidenceWords = {
    // Hard data (strong evidence)
    '% improvement': 3,
    'benchmark': 3,
    'peer-reviewed': 3,
    'published results': 3,
    
    // Specific details (moderate evidence)
    'compared to': 2,
    'measured': 2,
    'tested': 2,
    'deployed': 2,
    
    // Caveats (reality checks)
    'however': 1,
    'limited': 1,
    'early stage': 1,
    'pilot': 1
  };
  
  // Count hype signals
  for (const [word, weight] of Object.entries(hypeWords)) {
    if (title.includes(word)) hypeScore += weight;
    if (content.includes(word)) hypeScore += weight * 0.5;
  }
  
  // Count evidence signals
  for (const [word, weight] of Object.entries(evidenceWords)) {
    if (content.includes(word)) evidenceScore += weight;
  }
  
  // SPECIAL ADJUSTMENTS
  
  // Missing information penalty
  const notSpecifiedCount = (content.match(/not specified/g) || []).length;
  evidenceScore -= notSpecifiedCount * 2;
  
  // Source credibility (CHANGED: Added your sources)
  const credibleSources = ['mit', 'stanford', 'arxiv', 'nature', 'science', 'openai'];
  const hypeSources = ['techcrunch', 'venturebeat', 'businessinsider', 'ai-business'];
  
  if (credibleSources.some(s => article.source.toLowerCase().includes(s))) {
    evidenceScore += 2;
  }
  if (hypeSources.some(s => article.source.toLowerCase().includes(s))) {
    hypeScore += 2;
  }
  
  // Timeline reality check
  if (content.includes('by 2030') || content.includes('within 5 years')) {
    hypeScore += 2;
  }
  if (content.includes('already') || content.includes('now available')) {
    evidenceScore += 2;
  }
  
  // Category adjustment
  if (article.category === 'capabilities_and_how') hypeScore += 1;
  if (article.category === 'trends_risks_outlook') evidenceScore += 1;
  
  // FINAL CALCULATION
  const netHype = hypeScore - evidenceScore;
  
  // Map to 1-5 scale
  if (netHype <= -5) return 1;  // Very grounded
  if (netHype <= -2) return 2;  // Somewhat grounded  
  if (netHype <= 2) return 3;   // Balanced
  if (netHype <= 5) return 4;   // Somewhat hyped
  return 5;                      // Very hyped
}

// PHASE 2: Create monthly organized files - UNCHANGED
async function createMonthlyFiles(allArticles, publicDataPath) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const articlesByMonth = {};
  const monthsIndex = [];
  
  for (const article of allArticles) {
    const date = new Date(article.published_at);
    const year = date.getFullYear();
    const monthNum = date.getMonth();
    const monthName = monthNames[monthNum];
    
    const monthKey = `${monthName}_${year}_News`;
    const monthDisplay = `${monthName} ${year}`;
    
    if (!articlesByMonth[monthKey]) {
      articlesByMonth[monthKey] = {
        month: monthDisplay,
        year: year,
        month_num: monthNum + 1,
        filename: `${monthKey}.json`,
        articles: []
      };
    }
    
    articlesByMonth[monthKey].articles.push(article);
  }
  
  const dataDir = path.dirname(publicDataPath);
  console.log('\nCreating monthly files:');
  
  for (const [monthKey, monthData] of Object.entries(articlesByMonth)) {
    const monthFile = path.join(dataDir, monthData.filename);
    
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
    
    monthsIndex.push({
      month: monthData.month,
      year: monthData.year,
      month_num: monthData.month_num,
      filename: monthData.filename,
      article_count: monthData.articles.length
    });
  }
  
  monthsIndex.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month_num - a.month_num;
  });
  
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

// PHASE 1: Load all cached articles - UNCHANGED
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
        
        // CHANGED: Support both old (no optimized_headline) and new cache structures
        records.push({
          id: cached.content_hash,
          share_id: cached.share_id,
          category: cached.category,
          title: cached.title,
          optimized_headline: cached.optimized_headline || null,  // NEW: May not exist in old cache
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

// Main function with all integrated changes
async function main() {
  const parser = new Parser();
  const cacheDir = path.join(process.cwd(), 'data', 'cache');
  const publicData = path.join(process.cwd(), 'public', 'data', 'items.json');
  
  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`Cache directory: ${cacheDir}`);
  console.log(`Public data file: ${publicData}`);

  // Test RSS feeds - UNCHANGED
  console.log('\n🔍 Testing RSS feeds...');
  for (const s of SOURCES) {
    try {
      const testFeed = await parser.parseURL(s.rss);
      console.log(`✅ ${s.name}: ${testFeed.items?.length || 0} items available`);
    } catch (e) {
      console.log(`❌ ${s.name}: FAILED - ${e.message}`);
    }
  }
  console.log('RSS feed test complete.\n');

  await fs.mkdir(cacheDir, { recursive: true });
  await fs.mkdir(path.dirname(publicData), { recursive: true });

  const records = await loadAllCachedArticles(cacheDir);
  const existingHashes = new Set(records.map(r => r.id));
  console.log(`Starting with ${records.length} existing articles`);
  
  const cacheFiles = new Set(await fs.readdir(cacheDir).catch(() => []));

  let newArticlesCount = 0;
  for (const s of SOURCES) {
    console.log(`Processing source: ${s.name}`);
    try {
      const feed = await parser.parseURL(s.rss);
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

          if (existingHashes.has(hash)) {
            console.log(`  Already have: ${title.slice(0, 50)}...`);
            continue;
          }

          if (cacheFiles.has(`${hash}.json`)) {
            const cached = JSON.parse(await fs.readFile(cachePath, 'utf8'));
            records.push({
              id: hash,
              share_id: cached.share_id,
              category: cached.category,
              title: cached.title,
              optimized_headline: cached.optimized_headline || null,  // NEW
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
            // Process NEW article with all enhanced features
            console.log(`  Processing NEW article: ${title.slice(0, 50)}...`);
            
            // Classification
            let category = ruleClassify({ domain: s.domain, title, lede });
            if (!category) category = await classifyTieBreaker(title, lede);
            
            // Summarization
            const sum = await summarizeArticle(`${title}\n\n${lede}\n\n${body}`);
            
            // NEW: Headline optimization
            const optimizedHeadline = await rewriteHeadline(title);
            
            // NEW: Build article data for hype calculation
            const articleData = {
              title,
              source,
              category
            };
            
            // NEW: Dynamic hype meter
            const hypeMeter = calculateHypeMeter(articleData, sum);
            
            const fullArticleData = {
              content_hash: hash,
              share_id: generateShortId(title),
              title,
              optimized_headline: optimizedHeadline,  // NEW
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
              hype_meter: hypeMeter,  // CHANGED: Now dynamic
              model_meta: { 
                model: 'gpt-4o-mini', 
                prompt_version: 'v2.0'  // CHANGED: Version bump for new prompts
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              processing_order: Date.now() + index
            };
            
            // Save to cache
            await fs.writeFile(cachePath, JSON.stringify(fullArticleData, null, 2));
            
            // Add to records
            records.push({
              id: hash,
              share_id: fullArticleData.share_id,
              category: fullArticleData.category,
              title: fullArticleData.title,
              optimized_headline: fullArticleData.optimized_headline,  // NEW
              source: fullArticleData.source,
              url: fullArticleData.url,
              published_at: fullArticleData.published_at,
              speedrun: fullArticleData.speedrun,
              why_it_matters: fullArticleData.why_it_matters,
              lenses: fullArticleData.lenses,
              hype_meter: fullArticleData.hype_meter,
              processing_order: fullArticleData.processing_order
            });
            
            newArticlesCount++;
            console.log(`    ✓ NEW from ${s.name}: "${optimizedHeadline}" (hype: ${hypeMeter}/5)`);
            console.log(`  ✓ Processed and cached new article`);
          }
        } catch (itemError) {
          console.error(`  ✗ Failed to process item "${item.title || 'unknown'}":`, itemError.message);
        }
      }
    } catch (sourceError) {
      console.error(`Failed to process source ${s.name}:`, sourceError.message);
    }
    console.log(`✅ Finished ${s.name}: Total articles now = ${records.length}`);
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
    
    // NEW: Show sample of optimized headlines
    const withOptimized = parsedContent.articles.filter(a => a.optimized_headline);
    if (withOptimized.length > 0) {
      console.log(`✓ ${withOptimized.length} articles have optimized headlines`);
    }
  } catch (verifyError) {
    console.error('Failed to verify written file:', verifyError.message);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
