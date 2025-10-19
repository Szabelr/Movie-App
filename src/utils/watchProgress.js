// Utility functions for managing watch progress in localStorage

const WATCH_PROGRESS_KEY = 'movie-app-watch-progress';
const MAX_CONTINUE_WATCHING_ITEMS = 20;

/**
 * Get all watch progress items from localStorage
 * @returns {Array} Array of watch progress items
 */
export const getWatchProgress = () => {
  try {
    const stored = localStorage.getItem(WATCH_PROGRESS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading watch progress:', error);
    return [];
  }
};

/**
 * Save or update watch progress for a movie/TV show
 * @param {Object} progressData - Progress data from the player
 */
export const saveWatchProgress = (progressData) => {
  try {
    const { id, mediaType, currentTime, duration, progress, season, episode, timestamp } = progressData;
    
    // Don't save if progress is less than 1% or more than 95% (consider it finished)
    if (progress < 1 || progress > 95) {
      if (progress > 95) {
        // Remove from continue watching if finished
        removeWatchProgress(id, mediaType);
      }
      return;
    }

    const allProgress = getWatchProgress();
    
    // Find existing entry
    const existingIndex = allProgress.findIndex(
      item => item.id === id && item.mediaType === mediaType
    );

    const progressItem = {
      id,
      mediaType,
      currentTime,
      duration,
      progress,
      season,
      episode,
      timestamp: timestamp || Date.now(),
      lastWatched: Date.now(),
    };

    if (existingIndex !== -1) {
      // Update existing entry
      allProgress[existingIndex] = progressItem;
    } else {
      // Add new entry at the beginning
      allProgress.unshift(progressItem);
    }

    // Sort by lastWatched (most recent first) and limit to MAX items
    const sortedProgress = allProgress
      .sort((a, b) => b.lastWatched - a.lastWatched)
      .slice(0, MAX_CONTINUE_WATCHING_ITEMS);

    localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(sortedProgress));
  } catch (error) {
    console.error('Error saving watch progress:', error);
  }
};

/**
 * Get watch progress for a specific movie/TV show
 * @param {string} id - Movie/TV show ID
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Object|null} Progress data or null if not found
 */
export const getItemProgress = (id, mediaType) => {
  const allProgress = getWatchProgress();
  return allProgress.find(item => item.id === id && item.mediaType === mediaType) || null;
};

/**
 * Remove watch progress for a specific movie/TV show
 * @param {string} id - Movie/TV show ID
 * @param {string} mediaType - 'movie' or 'tv'
 */
export const removeWatchProgress = (id, mediaType) => {
  try {
    const allProgress = getWatchProgress();
    const filtered = allProgress.filter(
      item => !(item.id === id && item.mediaType === mediaType)
    );
    localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing watch progress:', error);
  }
};

/**
 * Clear all watch progress
 */
export const clearAllWatchProgress = () => {
  try {
    localStorage.removeItem(WATCH_PROGRESS_KEY);
  } catch (error) {
    console.error('Error clearing watch progress:', error);
  }
};

/**
 * Clean up old entries (older than 30 days)
 */
export const cleanupOldProgress = () => {
  try {
    const allProgress = getWatchProgress();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const filtered = allProgress.filter(item => item.lastWatched > thirtyDaysAgo);
    
    if (filtered.length !== allProgress.length) {
      localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('Error cleaning up old progress:', error);
  }
};
