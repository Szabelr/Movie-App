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
    <article
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
    >
      <div className="movie-card__poster">
        <img
          src={poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : './no-movie.png'}
          alt={displayTitle}
        />

        <div className="movie-card__overlay" />

        {vote_average ? (
          <span className="movie-card__rating">
            <img src="./star.svg" alt="Star Icon" />
            {vote_average.toFixed(1)}
          </span>
        ) : null}
      </div>

      <div className="movie-card__content">
        <div className="movie-card__header">
          <h3>{displayTitle}</h3>
          <span className="movie-card__chip">{isTv ? 'TV' : 'Movie'}</span>
        </div>

        <p className="movie-card__meta">
          {isTv ? (
            <>
              {seasonCount
                ? `${seasonCount} season${seasonCount === 1 ? '' : 's'}`
                : 'Seasons unavailable'}
              {displayDate ? ` • ${new Date(displayDate).getFullYear()}` : ''}
              {original_language ? ` • ${original_language.toUpperCase()}` : ''}
            </>
          ) : (
            <>
              {displayDate
                ? new Date(displayDate).toLocaleDateString(undefined, { year: 'numeric' })
                : 'Date TBD'}
              {original_language ? ` • ${original_language.toUpperCase()}` : ''}
            </>
          )}
        </p>

        <div className="movie-card__footer">
          <span className="movie-card__cta">
            View details
            <span aria-hidden="true"> →</span>
          </span>
        </div>
      </div>
    </article>
  );
};

export default MovieCard;
