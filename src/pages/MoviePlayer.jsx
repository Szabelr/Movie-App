import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { saveWatchProgress, getItemProgress } from '../utils/watchProgress';

const MoviePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const lastSaveTimeRef = useRef(0);
  const SAVE_INTERVAL = 5000; // Save every 5 seconds minimum

  const searchParams = new URLSearchParams(location.search);
  const mediaType = searchParams.get('type') === 'tv' ? 'tv' : 'movie';
  
  // Get saved progress to resume from
  const savedProgress = getItemProgress(id, mediaType);
  const startTime = savedProgress?.currentTime || 0;

  // Build embed URL with resume time if available
  const embedUrl =
    mediaType === 'tv'
      ? `https://www.vidking.net/embed/tv/${id}/1/1?autoPlay=true&nextEpisode=true&episodeSelector=true${startTime > 0 ? `&progress=${Math.floor(startTime)}` : ''}`
      : `https://www.vidking.net/embed/movie/${id}?autoPlay=true${startTime > 0 ? `&progress=${Math.floor(startTime)}` : ''}`;

  useEffect(() => {
    // Listen for messages from the video player
    const handleMessage = (event) => {
      try {
        // Parse the message data
        let messageData;
        if (typeof event.data === 'string') {
          try {
            messageData = JSON.parse(event.data);
          } catch {
            // If it's not JSON, ignore it
            return;
          }
        } else {
          messageData = event.data;
        }

        // Check if it's a player event
        if (messageData?.type === 'PLAYER_EVENT' && messageData?.data) {
          const eventData = messageData.data;
          const { event: eventType, currentTime, duration, progress, season, episode, timestamp } = eventData;

          // Only save progress periodically to avoid excessive localStorage writes
          const now = Date.now();
          const shouldSave = 
            eventType === 'ended' || 
            eventType === 'pause' ||
            (eventType === 'timeupdate' && now - lastSaveTimeRef.current > SAVE_INTERVAL);

          if (shouldSave && currentTime && duration) {
            lastSaveTimeRef.current = now;
            
            saveWatchProgress({
              id,
              mediaType,
              currentTime,
              duration,
              progress: progress || (currentTime / duration) * 100,
              season,
              episode,
              timestamp: timestamp || now,
            });
          }
        }
      } catch (error) {
        console.error('Error processing player message:', error);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [id, mediaType]);

  return (
    <div
      style={{ width: '100vw', height: '100vh', position: 'fixed', inset: 0 }}
    >
      <button
        type="button"
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          zIndex: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          color: '#fff',
          border: 'none',
          padding: '0.75rem',
          borderRadius: '9999px',
          cursor: 'pointer',
          fontSize: '2rem',
          lineHeight: 1,
          transition: 'opacity 0.3s ease',
        }}
        aria-label="Go back"
      >
        ←
      </button>
      <iframe
        src={embedUrl}
        title="Movie Player"
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
        style={{ border: 'none' }}
      />
    </div>
  );
};

export default MoviePlayer;
