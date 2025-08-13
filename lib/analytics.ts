import { track } from '@vercel/analytics';

// Article engagement events
export const trackArticleClick = (articleData: {
  title: string;
  source: string;
  category: string;
  url: string;
  hype_meter?: number;
}) => {
  track('article_clicked', {
    article_title: articleData.title,
    source: articleData.source,
    category: articleData.category,
    article_url: articleData.url,
    hype_meter: articleData.hype_meter || 0,
    timestamp: new Date().toISOString()
  });
};

// Lens switching (Simple/PM/Engineer views)
export const trackLensSwitch = (lens: string, articleTitle: string) => {
  track('lens_switched', {
    lens_type: lens,
    article_title: articleTitle,
    timestamp: new Date().toISOString()
  });
};

// Signup funnel
export const trackSignupClick = () => {
  track('signup_clicked', {
    location: 'footer',
    cta_text: 'Join the Journey',
    timestamp: new Date().toISOString()
  });
};

// Scroll tracking
export const trackScrollDepth = (depth: number) => {
  track('feed_scrolled', {
    scroll_depth_percentage: depth,
    articles_visible: Math.floor(depth / 10), // Approximate
    timestamp: new Date().toISOString()
  });
};

// Category interest (for future filters)
export const trackCategoryView = (category: string) => {
  track('category_viewed', {
    category_name: category,
    timestamp: new Date().toISOString()
  });
};
