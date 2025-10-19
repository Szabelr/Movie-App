import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWatchProgress, cleanupOldProgress, removeWatchProgress } from '../utils/watchProgress';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  },
};

const ContinueWatchingCard = ({ item, movieData, onRemove }) => {
  const navigate = useNavigate();
  const { id, mediaType, progress, currentTime, duration, season, episode } = item;

  if (!movieData) return null;

  const {
    title,
    name,
    original_name,
    poster_path,
  } = movieData;

  const isTv = mediaType === 'tv';
  const displayTitle = isTv ? name || original_name || title : title || name || original_name;

  const handleClick = () => {
    navigate(`/movie/${id}?type=${mediaType}`);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    removeWatchProgress(id, mediaType);
    onRemove();
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const timeRemaining = duration - currentTime;

  return (
    <div
      className="continue-watching-card"
      role="button"
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      }}
      tabIndex={0}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      <button
        type="button"
        onClick={handleRemove}
        className="remove-btn"
        aria-label="Remove from continue watching"
        title="Remove from continue watching"
      >
        ✕
      </button>
      <div className="poster-container">
        <img
          src={poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : './no-movie.png'}
          alt={displayTitle}
        />
        <div className="progress-overlay">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-4">
        <h3>{displayTitle}</h3>
        {isTv && season && episode && (
          <p className="episode-info">S{season} E{episode}</p>
        )}
        <p className="time-info">{formatTime(timeRemaining)} left • {Math.floor(progress)}%</p>
      </div>
    </div>
  );
};

const ContinueWatching = () => {
  const [continueWatchingItems, setContinueWatchingItems] = useState([]);
  const [movieDataMap, setMovieDataMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadContinueWatching = async () => {
    setIsLoading(true);
    try {
      // Clean up old progress first
      cleanupOldProgress();
      
      const watchProgress = getWatchProgress();
      setContinueWatchingItems(watchProgress);

      // Fetch movie/TV data for each item
      const dataPromises = watchProgress.map(async (item) => {
        const { id, mediaType } = item;
        const cacheKey = `${mediaType}-${id}`;
        
        try {
          const endpoint = mediaType === 'tv' 
            ? `${API_BASE_URL}/tv/${id}`
            : `${API_BASE_URL}/movie/${id}`;
          
          const response = await fetch(endpoint, API_OPTIONS);
          if (!response.ok) return null;
          
          const data = await response.json();
          return { cacheKey, data };
        } catch (error) {
          console.error(`Error fetching data for ${mediaType} ${id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(dataPromises);
      const newDataMap = {};
      results.forEach((result) => {
        if (result) {
          newDataMap[result.cacheKey] = result.data;
        }
      });
      setMovieDataMap(newDataMap);
    } catch (error) {
      console.error('Error loading continue watching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContinueWatching();
  }, []);

  const handleRemove = () => {
    // Reload continue watching list after removal
    loadContinueWatching();
  };

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  if (continueWatchingItems.length === 0) {
    return null; // Don't show section if empty
  }

  return (
    <section className="continue-watching">
      <h2>Continue Watching</h2>
      <ul>
        {continueWatchingItems.map((item) => {
          const cacheKey = `${item.mediaType}-${item.id}`;
          return (
            <li key={cacheKey}>
              <ContinueWatchingCard
                item={item}
                movieData={movieDataMap[cacheKey]}
                onRemove={handleRemove}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default ContinueWatching;
