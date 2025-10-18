import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const MoviePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Back button always visible now

  const searchParams = new URLSearchParams(location.search);
  const mediaType = searchParams.get('type') === 'tv' ? 'tv' : 'movie';
  const embedUrl =
    mediaType === 'tv'
      ? `https://www.vidking.net/embed/tv/${id}/1/1?autoPlay=true&nextEpisode=true&episodeSelector=true`
      : `https://www.vidking.net/embed/movie/${id}`;



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
