import { track } from '@vercel/analytics';

// Google Analytics helper
const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag(...args);
  }
};

// Helper to get device type
const getDeviceType = () => {
  if (typeof window === 'undefined') return 'unknown';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Article engagement events
export const trackArticleClick = (articleData: {
  title: string;
  source: string;
  category: string;
  url: string;
  hype_meter?: number;
}) => {
  // Vercel Analytics tracking (unchanged)
  track('article_clicked', {
    article_title: articleData.title,
    source: articleData.source,
    category: articleData.category,
    article_url: articleData.url,
    hype_meter: articleData.hype_meter || 0,
    timestamp: new Date().toISOString()
  });
  
  // GA4 Recommended: select_item event for content selection
  gtag('event', 'select_item', {
    // Standard parameters
    item_list_id: 'article_feed',
    item_list_name: 'AI News Feed',
    // Items array with structured data
    items: [{
      item_id: articleData.url,
      item_name: articleData.title,
      item_category: articleData.category,
      item_category2: 'article',
      item_brand: articleData.source,
      // Using price field creatively for hype_meter (0-5 scale)
      price: articleData.hype_meter || 0,
      quantity: 1
    }],
    // Additional standard parameters
    value: articleData.hype_meter || 0,
    currency: 'USD' // Required when using value
  });
  
  // Also send a custom event with all details for deeper analysis
  gtag('event', 'article_interaction', {
    action: 'click',
    article_title: articleData.title,
    article_source: articleData.source,
    article_category: articleData.category,
    article_url: articleData.url,
    hype_meter: articleData.hype_meter || 0,
    device_type: getDeviceType()
  });
};

// Share tracking
export const trackShare = (shareData: {
  title: string;
  source: string;
  category: string;
  url: string;
  hype_meter?: number;
  lens: string;
  time_on_article?: number;
}) => {
  // Vercel Analytics tracking (unchanged)
  track('article_shared', {
    article_title: shareData.title,
    source: shareData.source,
    category: shareData.category,
    article_url: shareData.url,
    hype_meter: shareData.hype_meter || 0,
    current_lens: shareData.lens,
    device_type: getDeviceType(),
    share_method: 'native_share',
    timestamp: new Date().toISOString()
  });
  
  // GA4 Recommended: share event (standard event)
  gtag('event', 'share', {
    // Standard share parameters
    method: 'native_share',
    content_type: 'article',
    item_id: shareData.url,
    // Additional context using items array
    items: [{
      item_id: shareData.url,
      item_name: shareData.title,
      item_category: shareData.category,
      item_brand: shareData.source,
      price: shareData.hype_meter || 0,
      quantity: 1
    }],
    // Custom parameters for additional context
    lens_type: shareData.lens,
    time_on_article: shareData.time_on_article || 0,
    device_type: getDeviceType()
  });
};

// Lens switching (Simple/PM/Engineer views)
export const trackLensSwitch = (lens: string, articleTitle: string) => {
  // Vercel Analytics tracking (unchanged)
  track('lens_switched', {
    lens_type: lens,
    article_title: articleTitle,
    timestamp: new Date().toISOString()
  });
  
  // GA4 Recommended: select_content event for UI interactions
  gtag('event', 'select_content', {
    // Standard parameters
    content_type: 'lens_view',
    content_id: lens,
    // Additional context
    items: [{
      item_id: lens,
      item_name: `${lens.toUpperCase()} View`,
      item_category: 'ui_interaction',
      item_category2: 'lens_selector'
    }]
  });
  
  // Also track as custom event for specific lens analysis
  gtag('event', 'lens_interaction', {
    lens_type: lens,
    article_context: articleTitle,
    device_type: getDeviceType(),
    // Engagement scoring
    engagement_score: lens === 'engineer' ? 3 : lens === 'pm' ? 2 : 1
  });
};

// Signup funnel
export const trackSignupClick = () => {
  // Vercel Analytics tracking (unchanged)
  track('signup_clicked', {
    location: 'footer',
    cta_text: 'Join the Journey',
    timestamp: new Date().toISOString()
  });
  
  // GA4 Recommended: generate_lead event for signup intent
  gtag('event', 'generate_lead', {
    // Standard parameters
    currency: 'USD',
    value: 0, // Can be used for lead scoring later
    // Custom parameters
    lead_source: 'footer_cta',
    cta_text: 'Join the Journey',
    form_destination: 'airtable',
    device_type: getDeviceType()
  });
  
  // Also track as begin_checkout for funnel analysis
  gtag('event', 'begin_checkout', {
    currency: 'USD',
    value: 0,
    items: [{
      item_id: 'aibyte_subscription',
      item_name: 'AIByte Early Access',
      item_category: 'subscription',
      price: 0,
      quantity: 1
    }]
  });
};

// Scroll tracking
export const trackScrollDepth = (depth: number) => {
  // Vercel Analytics tracking (unchanged)
  track('feed_scrolled', {
    scroll_depth_percentage: depth,
    articles_visible: Math.floor(depth / 10), // Approximate
    timestamp: new Date().toISOString()
  });
  
  // GA4 Recommended: scroll event (Enhanced Measurement event)
  // This is automatically tracked by GA4 if Enhanced Measurement is on,
  // but we can send custom scroll events for more control
  gtag('event', 'scroll', {
    // Standard scroll parameters
    percent_scrolled: depth,
    // Custom parameters for additional context
    engagement_type: depth >= 90 ? 'highly_engaged' : 
                     depth >= 50 ? 'engaged' : 
                     'browsing',
    articles_in_view: Math.floor(depth / 10),
    device_type: getDeviceType()
  });
  
  // Send milestone events for key scroll points
  if (depth === 25 || depth === 50 || depth === 75 || depth === 90) {
    gtag('event', 'scroll_milestone', {
      milestone: `${depth}_percent`,
      engagement_time: Date.now(), // Can calculate time to reach milestone
      device_type: getDeviceType()
    });
  }
};

// Category interest (for future filters)
export const trackCategoryView = (category: string) => {
  // Vercel Analytics tracking (unchanged)
  track('category_viewed', {
    category_name: category,
    timestamp: new Date().toISOString()
  });
  
  // GA4 Recommended: view_item_list event for category/list views
  gtag('event', 'view_item_list', {
    // Standard parameters
    item_list_id: `category_${category}`,
    item_list_name: category,
    // Items could be populated with articles in that category
    items: [{
      item_id: category,
      item_name: category,
      item_category: 'content_filter'
    }]
  });
  
  // Custom event for category interest tracking
  gtag('event', 'category_interest', {
    category_name: category,
    interaction_type: 'view',
    device_type: getDeviceType()
  });
};

// Additional tracking functions for better GA4 integration

// Track page/feed load
export const trackPageView = (pageName: string, articleCount?: number) => {
  // GA4 Recommended: page_view is automatic, but we can enhance it
  gtag('event', 'page_view', {
    page_title: pageName,
    page_location: window.location.href,
    page_path: window.location.pathname,
    // Custom parameters
    content_count: articleCount || 0,
    device_type: getDeviceType()
  });
  
  // If it's the main feed, also send view_item_list
  if (pageName === 'feed' && articleCount) {
    gtag('event', 'view_item_list', {
      item_list_id: 'main_feed',
      item_list_name: 'AI News Feed',
      number_of_items: articleCount
    });
  }
};

// Track user engagement time (for GA4 engagement metrics)
export const trackEngagementTime = (seconds: number, pageType: string) => {
  // GA4 Recommended: user_engagement event
  gtag('event', 'user_engagement', {
    engagement_time_msec: seconds * 1000,
    page_type: pageType,
    session_engaged: seconds > 10 ? '1' : '0'
  });
};

// Track search/filter actions (for future implementation)
export const trackSearch = (searchTerm: string, resultsCount: number) => {
  // GA4 Recommended: search event
  gtag('event', 'search', {
    search_term: searchTerm,
    number_of_results: resultsCount,
    device_type: getDeviceType()
  });
};

// Track content preferences (for personalization)
export const trackPreference = (preferenceType: string, value: string) => {
  // GA4 Custom event for preference tracking
  gtag('event', 'preference_set', {
    preference_type: preferenceType,
    preference_value: value,
    device_type: getDeviceType()
  });
};

// Session quality scoring (call on important interactions)
export const trackSessionQuality = (
  interactionCount: number, 
  lensChanges: number, 
  shares: number,
  timeOnSite: number
) => {
  const qualityScore = 
    (interactionCount * 1) + 
    (lensChanges * 2) + 
    (shares * 5) + 
    (Math.min(timeOnSite / 60, 10)); // Cap time contribution at 10 points
  
  gtag('event', 'session_quality', {
    quality_score: qualityScore,
    interaction_count: interactionCount,
    lens_changes: lensChanges,
    shares_count: shares,
    time_on_site_seconds: timeOnSite,
    engagement_level: 
      qualityScore > 20 ? 'power_user' :
      qualityScore > 10 ? 'engaged' :
      qualityScore > 5 ? 'active' :
      'passive',
    device_type: getDeviceType()
  });
};

// Export all for convenience
export default {
  trackArticleClick,
  trackShare,
  trackLensSwitch,
  trackSignupClick,
  trackScrollDepth,
  trackCategoryView,
  trackPageView,
  trackEngagementTime,
  trackSearch,
  trackPreference,
  trackSessionQuality
};
