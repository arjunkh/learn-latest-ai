import { track } from '@vercel/analytics';

// Google Analytics helper
const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag(...args);
  }
};

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
  gtag('event', 'article_click', {
    article_title: articleData.title,
    source: articleData.source,
    category: articleData.category,
  });
};

// Lens switching (Simple/PM/Engineer views)
export const trackLensSwitch = (lens: string, articleTitle: string) => {
  track('lens_switched', {
    lens_type: lens,
    article_title: articleTitle,
    timestamp: new Date().toISOString()
  });
  gtag('event', 'lens_switch', {
    lens_type: lens,
    article_title: articleTitle,
  });
};

// Signup funnel
export const trackSignupClick = () => {
  track('signup_clicked', {
    location: 'footer',
    cta_text: 'Join the Journey',
    timestamp: new Date().toISOString()
  });
  gtag('event', 'signup_click', {
    location: 'footer',
    cta_text: 'Join the Journey',
  });
};

// Scroll tracking
export const trackScrollDepth = (depth: number) => {
  track('feed_scrolled', {
    scroll_depth_percentage: depth,
    articles_visible: Math.floor(depth / 10), // Approximate
    timestamp: new Date().toISOString()
  });
  gtag('event', 'scroll', {
    percent_scrolled: depth,
  });
};

// Category interest (for future filters)
export const trackCategoryView = (category: string) => {
  track('category_viewed', {
    category_name: category,
    timestamp: new Date().toISOString()
  });
  gtag('event', 'view_category', {
    category_name: category,
  });
};
