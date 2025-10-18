import React, { useCallback, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Search from './components/search'
import Spinner from './components/spinner'
import MovieCard from './components/MovieCard'
import { useDebounce } from 'react-use'
import { updateSearchCount } from './appwrite.js'
import { getTrendingMovies } from './appwrite.js'
import MoviePlayer from './pages/MoviePlayer'

const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  },
}

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [movieList, setMovieList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [trendingMovies, setTrendingMovies] = useState([])
  const [mediaType, setMediaType] = useState('movie')
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

  const fetchMovies = useCallback(async (query = '', type = mediaType) => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const category = type === 'tv' ? 'tv' : 'movie'
      const endpoint = query
        ? `${API_BASE_URL}/search/${category}?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/${category}?sort_by=popularity.desc`

      const response = await fetch(endpoint, API_OPTIONS)
      if (!response.ok) throw new Error('Failed to fetch movies')

      const data = await response.json()
      let results = data.results || []

      if (type === 'tv' && results.length) {
        // Enrich TV show search results with season counts for display
        results = await Promise.all(
          results.map(async (show) => {
            try {
              const detailsResponse = await fetch(`${API_BASE_URL}/tv/${show.id}`, API_OPTIONS)
              if (!detailsResponse.ok) return show
              const details = await detailsResponse.json()
              return { ...show, number_of_seasons: details.number_of_seasons }
            } catch (detailsError) {
              console.error('Error fetching TV details:', detailsError)
              return show
            }
          })
        )
      }

      setMovieList(results)
      if (query && results.length > 0) await updateSearchCount(query, results[0])

    } catch (error) {
      console.error(`Error fetching movies: ${error}`)
      setErrorMessage('Failed to fetch movies. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }, [mediaType])
  const loadTrendingMovies = async () => {
    try{
      const movies = await getTrendingMovies();

      setTrendingMovies(movies);
    }
    catch(error){
      console.error("Error fetching trending movies:", error);
    }
  }
  useEffect(() => {
    fetchMovies(debouncedSearchTerm, mediaType)
  }, [debouncedSearchTerm, mediaType, fetchMovies])
  useEffect(() => {
    loadTrendingMovies()
  }, [])

  const toggleButtonStyle = (active) => ({
    padding: '0.5rem 1.25rem',
    borderRadius: '9999px',
    border: '1px solid rgba(255,255,255,0.4)',
    backgroundColor: active ? '#fff' : 'transparent',
    color: active ? '#000' : '#fff',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'background-color 0.2s ease, color 0.2s ease',
  })

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <h1>
            Watch <span className="text-gradient">Anything</span> For Free 
          </h1>
          <Search
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder={`Search for ${mediaType === 'movie' ? 'movies' : 'TV shows'}`}
          />
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              style={toggleButtonStyle(mediaType === 'movie')}
              onClick={() => setMediaType('movie')}
            >
              Movies
            </button>
            <button
              type="button"
              style={toggleButtonStyle(mediaType === 'tv')}
              onClick={() => setMediaType('tv')}
            >
              TV Shows
            </button>
          </div>
        </header>
        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Searches</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.searchTerm} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="all-movies">
          <h2>{mediaType === 'movie' ? 'All Movies' : 'All TV Shows'}</h2>

          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} mediaType={mediaType} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

const App = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/movie/:id" element={<MoviePlayer />} />
  </Routes>
)

export default App
