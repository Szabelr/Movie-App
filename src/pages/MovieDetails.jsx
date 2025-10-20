import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Spinner from '../components/spinner';
import MovieCard from '../components/MovieCard';
import { getItemProgress } from '../utils/watchProgress';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  },
};

const formatRuntime = (runtime) => {
  if (!runtime || Number.isNaN(Number(runtime))) return null;
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  if (hours <= 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
};

const MovieDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [cast, setCast] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const mediaType = searchParams.get('type') === 'tv' ? 'tv' : 'movie';

  const savedProgress = useMemo(() => getItemProgress(id, mediaType), [id, mediaType]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setErrorMessage('');

      const typePath = mediaType === 'tv' ? 'tv' : 'movie';

      try {
        const [detailsResponse, creditsResponse] = await Promise.all([
          fetch(
            `${API_BASE_URL}/${typePath}/${id}?append_to_response=videos,recommendations`,
            API_OPTIONS,
          ),
          fetch(`${API_BASE_URL}/${typePath}/${id}/credits`, API_OPTIONS),
        ]);

        if (!detailsResponse.ok) {
          throw new Error('Failed to load details');
        }

        const detailsData = await detailsResponse.json();
        const creditsData = creditsResponse.ok ? await creditsResponse.json() : null;

        setDetails(detailsData);
        setCast(creditsData?.cast?.slice(0, 10) ?? []);
      } catch (error) {
        console.error('Error fetching details:', error);
        setErrorMessage('Unable to load this title right now. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id, mediaType]);

  const handleWatch = () => {
    const fromPath = `${location.pathname}${location.search}`;
    navigate(`/watch/${id}?type=${mediaType}`, { state: { from: fromPath } });
  };

  const handleBack = () => {
    if (window.history.length <= 1) {
      navigate('/');
      return;
    }
    navigate(-1);
  };

  if (isLoading) {
    return (
      <main className="movie-details">
        <div className="movie-details__loading">
          <Spinner />
        </div>
      </main>
    );
  }

  if (errorMessage || !details) {
    return (
      <main className="movie-details">
        <div className="movie-details__loading">
          <p>{errorMessage || 'Title not found.'}</p>
          <button type="button" className="back-button" onClick={handleBack}>
            Go back
          </button>
        </div>
      </main>
    );
  }

  const {
    backdrop_path,
    poster_path,
    title,
    name,
    original_name,
    vote_average,
    release_date,
    first_air_date,
    overview,
    genres,
    runtime,
    episode_run_time,
    number_of_seasons,
    number_of_episodes,
    status,
    videos,
    recommendations,
    tagline,
    spoken_languages,
    created_by,
  } = details;

  const displayTitle = mediaType === 'tv' ? name || original_name || title : title || name || original_name;
  const displayDate = mediaType === 'tv' ? first_air_date : release_date;
  const formattedYear = displayDate ? new Date(displayDate).getFullYear() : null;
  const formattedDateFull = displayDate
    ? new Date(displayDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;
  const formattedRuntime = mediaType === 'tv'
    ? formatRuntime(Array.isArray(episode_run_time) ? episode_run_time[0] : episode_run_time)
    : formatRuntime(runtime);

  const trailer = videos?.results?.find(
    (video) => video.type === 'Trailer' && video.site === 'YouTube',
  );

  const hasProgress = savedProgress && savedProgress.progress > 0;
  const primaryActionLabel = hasProgress
    ? `Resume${savedProgress.progress ? ` (${Math.round(savedProgress.progress)}%)` : ''}`
    : 'Watch Now';

  const languageNames = spoken_languages
    ?.map((language) => language.english_name || language.name)
    .filter(Boolean);

  const keyFacts = [
    formattedDateFull
      ? {
          label: mediaType === 'tv' ? 'First Aired' : 'Released',
          value: formattedDateFull,
        }
      : null,
    formattedRuntime
      ? {
          label: mediaType === 'tv' ? 'Avg. Episode Length' : 'Runtime',
          value: formattedRuntime,
        }
      : null,
    status
      ? {
          label: 'Status',
          value: status,
        }
      : null,
    vote_average
      ? {
          label: 'TMDB Score',
          value: `${vote_average.toFixed(1)} / 10`,
        }
      : null,
    mediaType === 'tv' && number_of_seasons
      ? {
          label: 'Seasons',
          value: `${number_of_seasons}${number_of_episodes ? ` • ${number_of_episodes} episodes` : ''}`,
        }
      : null,
    languageNames?.length
      ? {
          label: 'Spoken Languages',
          value: languageNames.join(', '),
        }
      : null,
  ].filter(Boolean);

  const creatorNames = created_by?.map((creator) => creator.name).filter(Boolean);

  const recommendationsList = recommendations?.results
    ?.filter((item) => item && item.id !== Number(id))
    ?.slice(0, 8);

  return (
    <main className="movie-details">
      <div
        className="movie-details__backdrop"
        style={{
          backgroundImage: backdrop_path || poster_path
            ? `url(https://image.tmdb.org/t/p/original${backdrop_path || poster_path})`
            : undefined,
        }}
      >
        <div className="movie-details__overlay" />
      </div>

      <div className="movie-details__content">
        <button type="button" className="back-button" onClick={handleBack}>
          ← Back
        </button>

        <section className="movie-details__hero">
          <div className="movie-details__poster">
            <img
              src={poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : '/no-movie.png'}
              alt={displayTitle}
            />

            <div className="movie-details__poster-overlay">
              {vote_average ? (
                <span className="movie-details__poster-badge">
                  <img src="/star.svg" alt="Star icon" />
                  {vote_average.toFixed(1)}
                </span>
              ) : null}
              {formattedRuntime ? <span className="movie-details__poster-runtime">{formattedRuntime}</span> : null}
            </div>
          </div>

          <div className="movie-details__info">
            <div className="movie-details__headline">
              <p className="movie-details__label">{mediaType === 'tv' ? 'TV Show' : 'Movie'}</p>
              <h1>{displayTitle}</h1>
              {tagline && <p className="movie-details__tagline">{tagline}</p>}
            </div>

            <div className="movie-details__meta">
              {formattedYear && <span>{formattedYear}</span>}
              {mediaType === 'tv' && number_of_seasons ? (
                <span>
                  {number_of_seasons} season{number_of_seasons === 1 ? '' : 's'}
                  {number_of_episodes ? ` • ${number_of_episodes} episodes` : ''}
                </span>
              ) : null}
              {status && <span>{status}</span>}
            </div>

            {genres?.length ? (
              <ul className="movie-details__genres" aria-label="Genres">
                {genres.map((genre) => (
                  <li key={genre.id}>{genre.name}</li>
                ))}
              </ul>
            ) : null}

            <div className="movie-details__actions">
              <button type="button" className="primary" onClick={handleWatch}>
                {primaryActionLabel}
              </button>
              {trailer ? (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank')}
                >
                  Watch Trailer
                </button>
              ) : null}
            </div>

            {hasProgress && savedProgress?.season && savedProgress?.episode && (
              <p className="movie-details__progress-info">
                Last watched: Season {savedProgress.season}, Episode {savedProgress.episode}
              </p>
            )}
          </div>
        </section>

        {overview ? (
          <section className="movie-details__section movie-details__section--overview">
            <div className="movie-details__section-header">
              <h2>Overview</h2>
            </div>
            <p>{overview}</p>
          </section>
        ) : null}

        {keyFacts.length ? (
          <section className="movie-details__section movie-details__facts">
            <div className="movie-details__section-header">
              <h2>Key Facts</h2>
              <p>All the essential details before you press play.</p>
            </div>
            <dl>
              {keyFacts.map(({ label, value }) => (
                <div key={label} className="movie-details__fact">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {creatorNames?.length ? (
          <section className="movie-details__section movie-details__creators">
            <div className="movie-details__section-header">
              <h2>Created by</h2>
            </div>
            <p>{creatorNames.join(', ')}</p>
          </section>
        ) : null}

        {languageNames?.length ? (
          <section className="movie-details__section movie-details__languages">
            <div className="movie-details__section-header">
              <h2>Spoken Languages</h2>
            </div>
            <ul>
              {languageNames.map((language) => (
                <li key={language}>{language}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {cast.length > 0 && (
          <section className="movie-details__section">
            <h2>Top Cast</h2>
            <ul className="movie-details__cast">
              {cast.map((member) => (
                <li key={member.id}>
                  <img
                    src={member.profile_path
                      ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                      : '/no-movie.png'}
                    alt={member.name}
                  />
                  <p className="name">{member.name}</p>
                  {member.character && <p className="character">as {member.character}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {recommendationsList?.length ? (
          <section className="movie-details__section">
            <div className="movie-details__section-header">
              <h2>More Like This</h2>
              <p>Discover similar {mediaType === 'tv' ? 'shows' : 'movies'} you might enjoy.</p>
            </div>
            <ul className="movie-details__recommendations">
              {recommendationsList.map((item) => (
                <li key={`${mediaType}-${item.id}`}>
                  <MovieCard movie={item} mediaType={mediaType} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
};

export default MovieDetails;
