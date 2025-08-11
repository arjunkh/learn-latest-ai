import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import Parser from 'rss-parser';
import OpenAI from 'openai';

const SOURCES = [
  { id: 'openai', name: 'OpenAI', rss: 'https://openai.com/blog/rss.xml', domain: 'openai.com' },
  { id: 'deepmind', name: 'Google DeepMind', rss: 'https://deepmind.google/discover/rss', domain: 'deepmind.google' },
  { id: 'verge-ai', name: 'The Verge (AI)', rss: 'https://www.theverge.com/rss/ai/index.xml', domain: 'theverge.com' }
];

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function contentHash({ title, source, published_at, body }) {
  return crypto.createHash('sha256').update(`${title.trim().toLowerCase()}||${source}||${published_at}||${body}`).digest('hex');
}

function ruleClassify({ domain, title, lede }) {
  const t = `${title} ${lede}`.toLowerCase();
  if (['openai.com','deepmind.google','huggingface.co'].some(d => domain.includes(d))) return 'capabilities_and_how';
  if (['launch','rollout','deploys','integrates','partners','available','beta'].some(w => t.includes(w))) return 'in_action_real_world';
  if (['policy','regulation','ethics','governance','risk','impact','jobs','economy','law'].some(w => t.includes(w))) return 'trends_risks_outlook';
  return null;
}

async function classifyTieBreaker(title, lede) {
  const prompt = `Classify this headline + first paragraph into exactly one:
- capabilities_and_how
- in_action_real_world
- trends_risks_outlook
Return only the id.
Headline: ${title}
Dek: ${lede}`;

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0
  });
  
  return (res.choices[0]?.message?.content || '').trim();
}

async function summarizeArticle(fullText) {
  const prompt = `You are a precise AI news editor. Summarize the article.

Return JSON with keys:
- speedrun: <=40 words, one sentence, plain English
- why_it_matters: array of 2 bullets, each <=14 words
- lenses:
  - eli12: 2-3 sentences, simple language
  - pm: 2-3 sentences on users, market, differentiation, risks
  - engineer: 2-3 sentences on method, data, constraints, limits
Constraints: Be factual. No hype. If uncertain, state what is unknown.

Article:
${fullText}`;

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2
  });
  
  return JSON.parse(res.choices[0]?.message?.content || '{}');
}

async function main() {
  const parser = new Parser();
  const cacheDir = path.join(process.cwd(), 'data', 'cache');
  const publicData = path.join(process.cwd(), 'public', 'data', 'items.json');
  await fs.mkdir(cacheDir, { recursive: true });

  const existing = new Set(await fs.readdir(cacheDir).catch(() => []));
  const records = [];

  for (const s of SOURCES) {
    const feed = await parser.parseURL(s.rss);
    for (const item of (feed.items || []).slice(0, 8)) {
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
      } else {
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
          updated_at: new Date().toISOString()
        };
        await fs.writeFile(cachePath, JSON.stringify(rec, null, 2));
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
        hype_meter: rec.hype_meter
      });
    }
  }

  const cutoff = Date.now() - 14 * 24 * 3600 * 1000;
  const latest = records.filter(r => new Date(r.published_at).getTime() >= cutoff)
                        .sort((a, b) => b.published_at.localeCompare(a.published_at));

  await fs.mkdir(path.dirname(publicData), { recursive: true });
  await fs.writeFile(publicData, JSON.stringify(latest, null, 2));
  console.log(`Built ${latest.length} items → public/data/items.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
