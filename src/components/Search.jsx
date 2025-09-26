"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faBookmark } from "@fortawesome/free-solid-svg-icons";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import Image from "next/image";
import Link from "next/link";
import Spinner from "react-bootstrap/Spinner";
import InputGroup from "react-bootstrap/InputGroup";
import Button from "react-bootstrap/Button";
import { getExternalApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import slugify from "slugify";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";
const THUMBNAIL_SIZE = "w300";
const BOOKMARKS_STORAGE_KEY = "userBookmarks";

const createSlug = (title) => {
  if (!title) return "";

  let slug = slugify(title, {
    lower: true,
    strict: true,
    locale: "en",
  });
  if (!slug) {
    slug = title.trim().replace(/\s+/g, "-");
  }

  return slug;
};

const fetchAllGenresMap = async () => {
  try {
    const [movieGenres, tvGenres] = await Promise.all([
      getExternalApi("/genre/movie/list", { language: "id-ID" }),
      getExternalApi("/genre/tv/list", { language: "id-ID" }),
    ]);

    const genreMap = new Map();
    movieGenres.genres.forEach((genre) => genreMap.set(genre.id, genre.name));
    tvGenres.genres.forEach((genre) => genreMap.set(genre.id, genre.name));
    return genreMap;
  } catch (error) {
    console.error("Failed to fetch genres:", error);
    return new Map();
  }
};

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [trendingSuggestions, setTrendingSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genresMap, setGenresMap] = useState(new Map());
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchInputRef = useRef(null);

  useEffect(() => {
    const loadGenres = async () => {
      const map = await fetchAllGenresMap();
      setGenresMap(map);
    };
    loadGenres();
  }, []);

  const processTmdbItem = useCallback(
    (item) => {
      const genreNames =
        item.genre_ids
          ?.map((id) => genresMap.get(id))
          ?.filter(Boolean)
          ?.join(", ") || "N/A";
      const releaseDate = item.release_date || item.first_air_date;
      const year = releaseDate ? format(new Date(releaseDate), "yyyy") : "N/A";
      const title = item.title || item.name;
      const slug = createSlug(title);

      return {
        id: item.id,
        media_type: item.media_type,
        title: title,
        slug: slug,
        poster_path: item.poster_path,
        genreNames: genreNames,
        releaseDate: releaseDate,
        year: year,
      };
    },
    [genresMap]
  );

  const fetchTrendingContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { results } = await getExternalApi("/trending/all/week", {
        language: "en-US",
      });
      const filteredResults = results
        .filter((item) => item.media_type !== "person")
        .slice(0, 10);
      const processedTrending = filteredResults.map(processTmdbItem);
      setTrendingSuggestions(processedTrending);
    } catch (err) {
      console.error("Failed to fetch trending content:", err);
      setTrendingSuggestions([]);
      setError("Gagal memuat konten tren.");
    } finally {
      setLoading(false);
    }
  }, [processTmdbItem]);

  const searchContent = useCallback(
    async (query) => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [movieResults, tvResults] = await Promise.all([
          getExternalApi(`/search/movie`, { query: query, language: "en-US" }),
          getExternalApi(`/search/tv`, { query: query, language: "en-US" }),
        ]);

        const combinedResults = [
          ...(movieResults.results || []).map((item) => ({
            ...item,
            media_type: "movie",
          })),
          ...(tvResults.results || []).map((item) => ({
            ...item,
            media_type: "tv",
          })),
        ];

        const sortedResults = combinedResults
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 10);

        const processedSuggestions = sortedResults.map(processTmdbItem);
        setSuggestions(processedSuggestions);
      } catch (err) {
        console.error("Failed to fetch search suggestions:", err);
        setSuggestions([]);
        setError("Gagal melakukan pencarian.");
      } finally {
        setLoading(false);
      }
    },
    [processTmdbItem]
  );

  useEffect(() => {
    if (!submittedQuery.trim()) {
      fetchTrendingContent();
    }
  }, [submittedQuery, fetchTrendingContent]);

  const handleSearch = () => {
    setSubmittedQuery(searchQuery);
    searchContent(searchQuery);
  };

  const displaySuggestions = submittedQuery.trim()
    ? suggestions
    : trendingSuggestions;
  const isSearchActive = submittedQuery.trim().length > 0;

  const handleFavoriteClick = useCallback((e, movie) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const storedBookmarks = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      const bookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : [];

      const isAlreadyBookmarked = bookmarks.some(
        (bookmark) => bookmark.id === movie.id
      );

      if (isAlreadyBookmarked) return;

      const releaseDate = movie.release_date || movie.first_air_date;
      const ryear = releaseDate ? format(parseISO(releaseDate), "yyyy") : "";
      const movietitle = movie.title || movie.name;
      const title = ryear ? `${movietitle} (${ryear})` : movietitle;

      const bookmarkData = {
        id: movie.id,
        title: title,
        media_type: movie.media_type,
        year: ryear,
        posterUrl: `https://image.tmdb.org/t/p/w200${movie.poster_path}`,
      };
      const newBookmarks = [...bookmarks, bookmarkData];
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(newBookmarks));
      window.dispatchEvent(new Event("bookmarksUpdated"));
    } catch (error) {
      console.error("Failed to add to bookmarks:", error);
    }
  }, []);

  return (
    <div className="bg-search">
      <div className="mx-2 mx-sm-5">
        <Container fluid className="p-0">
          <div className="search-top-container d-flex align-items-center justify-content-center">
            <div className="d-flex align-items-center flex-column gap-4 width-50 width-100 text-center">
              <h1 className="search-top-title m-0">
                <FontAwesomeIcon icon={faSearch} height={30} width={30} />{" "}
                Search
              </h1>
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="w-100"
              >
                <InputGroup className="bg-dark text-white">
                  <Form.Control
                    className="transparent-input search-input border-grey  text-white"
                    ref={searchInputRef}
                    type="search"
                    placeholder="Cari berdasarkan judul atau kata kunci terkait..."
                    value={searchQuery}
                    aria-describedby="basic-search"
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </Form>
              <Button
                className="btn btn-primary btn-custom-red"
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>
          </div>
          {loading && (
            <div className="text-center text-white mb-3 mt-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Memuat saran...</span>
              </Spinner>
            </div>
          )}

          {error && <p className="text-center text-white mt-3">{error}</p>}

          {!loading && !error && (
            <>
              {isSearchActive && suggestions.length === 0 && (
                <p className="text-center text-white mt-3">
                  Hasil pencarian tidak ditemukan.
                </p>
              )}

              {!isSearchActive && trendingSuggestions.length === 0 && (
                <p className="text-center text-white mt-3">
                  Tidak ada konten tren yang tersedia.
                </p>
              )}
              {displaySuggestions.length > 0 && (
                <div className="mx-0 mx-sm-5">
                  <h6 className=" pb-2 text-white">
                    <FontAwesomeIcon icon={faSearch} height={30} width={30} />
                    {isSearchActive
                      ? ` Hasil Pencarian untuk "${submittedQuery}"`
                      : " Konten Trending"}
                  </h6>
                  <div className="movie-list ">
                    {displaySuggestions.map((item) => (
                      <div
                        key={`${item.id}-${item.page}`}
                        className="movie-container movie-filter-size"
                        tabIndex="0"
                      >
                        <div className="add-bookmark-btn">
                          <button
                            className="btn btn-secondary btn-custom-gray rounded-pill"
                            onClick={(e) => handleFavoriteClick(e, item)}
                            aria-label="Add to bookmarks"
                          >
                            <FontAwesomeIcon icon={faBookmark} />
                          </button>
                        </div>
                        <Link
                          href={`/stream/${item.media_type}/${item.id}/${item.slug}`}
                          key={item.id + item.media_type}
                          title={item?.name || item?.title}
                          className="cursor-pointer mb-3"
                        >
                          {item.poster_path ? (
                            <Image
                              src={`${TMDB_IMAGE_BASE_URL}${THUMBNAIL_SIZE}${item.poster_path}`}
                              alt={item.title}
                              className="img-fluid"
                              width={218}
                              height={308}
                              priority
                            />
                          ) : (
                            <div
                              className="text-white-50 d-flex align-items-center justify-content-center"
                              style={{
                                width: "218px",
                                height: "308px",
                                fontSize: "0.75rem",
                                flexShrink: 0,
                                border: "1px solid #333",
                                backgroundColor: "#1c1c1c",
                              }}
                            >
                              No Image
                            </div>
                          )}
                        </Link>
                        <div className="movie-title">
                          <Link
                            href={`/stream/${item.media_type}/${item.id}/${item.slug}`}
                            title={item?.name || item?.title}
                            style={{ textDecoration: "none" }}
                          >
                            <span>{item.title || item.name}</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Container>
      </div>
    </div>
  );
};

export default Search;
