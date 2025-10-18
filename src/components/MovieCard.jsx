import React from 'react';
import { useNavigate } from 'react-router-dom';

const MovieCard = ({ movie, mediaType = 'movie' }) => {
  const {
    id,
    title,
    name,
    original_name,
    vote_average,
    poster_path,
    release_date,
    first_air_date,
    original_language,
    number_of_seasons,
    seasons,
  } = movie;

  const navigate = useNavigate();
  const isTv = mediaType === 'tv';
  const displayTitle = isTv ? name || original_name || title : title || name || original_name;
  const displayDate = isTv ? first_air_date : release_date;
  const seasonCount = isTv
    ? number_of_seasons ?? seasons?.length ?? movie.total_seasons
    : null;

  const handleOpenMovie = () => navigate(`/movie/${id}?type=${mediaType}`);

  return (
    <div
      className="movie-card"
      role="button"
      onClick={handleOpenMovie}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOpenMovie();
        }
      }}
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      <img
        src={poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : './no-movie.png'}
        alt={displayTitle}
      />

      <div className="mt-4">
        <h3>{displayTitle}</h3>

        <div className="content">
          <div className="rating">
            <img src="./star.svg" alt="Star Icon" />
            <span>{vote_average?.toFixed(1)}</span>
          </div>

          <p className="text-sm text-gray-500">
            {isTv ? (
              <>
                {seasonCount
                  ? `${seasonCount} season${seasonCount === 1 ? '' : 's'}`
                  : 'Seasons unavailable'}
                {displayDate ? ` • ${displayDate}` : ''}
                {original_language ? ` • ${original_language.toUpperCase()}` : ''}
              </>
            ) : (
              <>
                {displayDate}
                {original_language ? ` • ${original_language.toUpperCase()}` : ''}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
