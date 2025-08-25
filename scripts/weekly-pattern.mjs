// scripts/weekly-pattern.mjs
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Get articles from the last 7 days
async function getLastWeekArticles() {
  const cacheDir = path.join(process.cwd(), 'data', 'cache');
  
  try {
    const files = await fs.readdir(cacheDir);
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const articles = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const content = await fs.readFile(path.join(cacheDir, file), 'utf8');
      const article = JSON.parse(content);
      
      // Check if article is from last 7 days
      const articleDate = new Date(article.published_at).getTime();
      if (articleDate >= oneWeekAgo) {
        articles.push({
          title: article.title,
          date: article.published_at,
          dayOfWeek: new Date(article.published_at).toLocaleDateString('en-US', { weekday: 'short' }),
          summary: article.speedrun,
          source: article.source,
          category: article.category,
          url: article.url
        });
      }
    }
    
    // Sort chronologically (Monday to Sunday)
    return articles.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  } catch (error) {
    console.error('Error reading articles:', error);
    return [];
  }
}

// Generate week ID (e.g., "2024-w47")
function getWeekId() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-w${weekNumber}`;
}

async function generateWeeklyPattern() {
  console.log('🔗 Generating The Pattern...\n');
  
  // Get last week's articles
  const articles = await getLastWeekArticles();
  console.log(`📰 Found ${articles.length} articles from the past week`);
  
  if (articles.length < 3) {
    console.log('⚠️ Not enough articles for meaningful pattern analysis');
    return null;
  }
  
  // Format articles for the prompt
  const articlesText = articles.map(a => 
    `${a.dayOfWeek}: "${a.title}" (${a.source})\nSummary: ${a.summary}\n`
  ).join('\n');
  
  // The refined prompt
  const prompt = `You are the lead analyst at AIByte, creating "The Pattern" - the weekly intelligence brief that reveals what others missed.

Analyze these ${articles.length} AI news articles from the past week and find the NON-OBVIOUS connection.

This week's articles:
${articlesText}

Your task: Find the hidden thread that connects these stories. Not just "lots of AI news" but the underlying force, fear, or opportunity driving these events.

Return ONLY valid JSON with this EXACT structure:
{
  "headline": "5-8 word provocative title that captures the hidden pattern",
  "hook": "One punchy sentence that makes readers go 'I hadn't connected those dots'",
  "story": "The real story in 2-3 sentences. Focus on WHY these happened together, not just what happened",
  "timeline": [
    {"day": "Mon", "event": "Event name", "context": "Why this matters to the pattern"},
    {"day": "Tue", "event": "Event name", "context": "Why this matters to the pattern"}
  ],
  "twist": "The counterintuitive insight that changes how readers see this trend",
  "winners": "Specific companies/roles that benefit from this pattern",
  "losers": "Specific companies/roles scrambling to adapt", 
  "dark_horse": "The unexpected player who might win big",
  "actions": [
    "Immediate action for Monday morning",
    "Strategic position to take this month",
    "Hidden opportunity others aren't seeing"
  ],
  "prediction": "One specific thing that will happen in the next 2 weeks based on this pattern",
  "quote": "One memorable line that captures the week's insight (make it shareable)"
}

Remember:
- Find the story BEHIND the stories
- Be specific with company names and roles
- Make readers feel like insiders who see what others miss
- The headline should make people stop scrolling
- Every insight should feel like privileged information`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7, // Creative but not wild
      max_tokens: 1500
    });
    
    let content = response.choices[0]?.message?.content || '{}';
    
    // Clean up any markdown formatting
    content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    
    // Extract JSON if wrapped in other text
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      content = content.substring(jsonStart, jsonEnd + 1);
    }
    
    const pattern = JSON.parse(content);
    
    // Add metadata
    pattern.week_id = getWeekId();
    pattern.week_start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
    pattern.week_end = new Date().toISOString();
    pattern.generated_at = new Date().toISOString();
    pattern.article_count = articles.length;
    pattern.articles = articles; // Include source articles for reference
    
    // Save to file
    const outputDir = path.join(process.cwd(), 'public', 'data');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, 'pattern-latest.json');
    await fs.writeFile(outputPath, JSON.stringify(pattern, null, 2));
    
    // Also save with week ID for historical reference (even if not displayed)
    const archivePath = path.join(outputDir, `pattern-${pattern.week_id}.json`);
    await fs.writeFile(archivePath, JSON.stringify(pattern, null, 2));
    
    console.log('\n✅ The Pattern generated successfully!');
    console.log(`📌 Headline: "${pattern.headline}"`);
    console.log(`🎯 Hook: ${pattern.hook}`);
    console.log(`🔮 Prediction: ${pattern.prediction}`);
    console.log(`\n📁 Saved to: pattern-latest.json`);
    
    return pattern;
    
  } catch (error) {
    console.error('❌ Error generating pattern:', error);
    
    // Create fallback pattern if generation fails
    const fallback = {
      headline: "This Week in AI",
      hook: "Pattern analysis unavailable",
      story: "We're having trouble analyzing this week's patterns. Check back soon.",
      timeline: articles.slice(0, 5).map(a => ({
        day: a.dayOfWeek,
        event: a.title,
        context: "Analysis pending"
      })),
      error: true,
      week_id: getWeekId(),
      generated_at: new Date().toISOString()
    };
    
    const outputPath = path.join(process.cwd(), 'public', 'data', 'pattern-latest.json');
    await fs.writeFile(outputPath, JSON.stringify(fallback, null, 2));
    
    return fallback;
  }
}

// Execute
generateWeeklyPattern()
  .then(pattern => {
    if (pattern && !pattern.error) {
      console.log('\n🎉 Ready to ship The Pattern to users!');
    }
  })
  .catch(console.error);
