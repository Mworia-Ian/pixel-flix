import React, { useState, useEffect } from "react";
import { useDebounce } from "react-use";
import Search from "./components/Search";
import Spinner from "./components/Spinner"
import MovieCard from "./components/MovieCard";
import { getTrendingMovies, updateSearchCount } from "./appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3/";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [moviesList, setMoviesList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([])
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  
  useDebounce (() => setDebouncedSearchTerm(searchTerm),1000, [searchTerm])

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      // call api
      const endpoint = query ?
        `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await response.json();

      if (data.Response === "False") {
        setErrorMessage(data.Error || "Failed to fetch Movies");
        setMoviesList([]);
        return;
      }

      setMoviesList(data.results || []);
      

      if(query && data.results.length >0){
        await updateSearchCount(query, data.results[0])
      }
    } catch (error) {
      console.log(`Error fetching movies: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadtrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies()

      setTrendingMovies(movies)

    } catch (error) {
      console.error(`Error fetching trending Movies: ${error}`)
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadtrendingMovies()
  }, [])

  const mainStyle = {
    backgroundImage: "url('BG.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    height: "100vh", // Ensure the main element takes the full viewport height
  };

  return (
    <main style={mainStyle}>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
            Without the Hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>
        <section className="trending">
        <ul>
            {
              trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>
                    {index + 1}
                  </p>
                  <img src={movie.poster_url} />
                </li>
              ))
            }

          </ul>
        </section>
          
        
        <section className="all-movies">
          <h2>All Movies</h2>

            {isLoading ? 
            
            ( <Spinner />) 
            
            : errorMessage ?

            (<p className="text-red-500">{errorMessage}</p>)  

            : (
              <ul>
                  {moviesList.map((movie) => ( 
                    <MovieCard key={movie.id} movie={movie}/>
                  ))}
              </ul>
            )

          }


        </section>
      </div>
    </main>
  );
};

export default App;
