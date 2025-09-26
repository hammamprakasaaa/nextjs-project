"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Modal from "react-bootstrap/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFire,
  faPlay,
  faForward,
  faPlayCircle,
  faFilm,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import Form from "react-bootstrap/Form";
import Image from "next/image";
import Link from "next/link";
import Spinner from "react-bootstrap/Spinner";
import InputGroup from "react-bootstrap/InputGroup";
import { getExternalApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import slugify from "slugify";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";
const THUMBNAIL_SIZE = "w92";

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
  const movieGenres = await getExternalApi("/genre/movie/list", {
    language: "en-US",
  });
  const tvGenres = await getExternalApi("/genre/tv/list", {
    language: "en-US",
  });

  const genreMap = new Map();
  movieGenres.genres.forEach((genre) => genreMap.set(genre.id, genre.name));
  tvGenres.genres.forEach((genre) => genreMap.set(genre.id, genre.name));
  return genreMap;
};

const SearchModal = ({ show, onHide }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [trendingSuggestions, setTrendingSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genresMap, setGenresMap] = useState(new Map());
  const router = useRouter();
  const searchInputRef = useRef(null);

  useEffect(() => {
    const loadGenres = async () => {
      const map = await fetchAllGenresMap();
      setGenresMap(map);
    };
    loadGenres();
  }, []);

  useEffect(() => {
    if (show && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [show]);

  const processTmdbItem = useCallback(
    (item) => {
      const genreNames =
        item.genre_ids
          ?.map((id) => genresMap.get(id))
          .filter(Boolean)
          .join(", ") || "N/A";

      const releaseDate = item.release_date || item.first_air_date;
      const year = releaseDate ? format(new Date(releaseDate), "yyyy") : "N/A";
      const title = item.title || item.name;

      const slug = createSlug(title);

      return {
        id: item.id,
        media_type: item.media_type,
        title: item.title || item.name,
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
    try {
      const { results } = await getExternalApi("/trending/all/week", {
        language: "en-US",
      });

      const filteredResults = results
        .filter((item) => item.media_type !== "person")
        .slice(0, 10);
      const processedTrending = filteredResults.map(processTmdbItem);
      setTrendingSuggestions(processedTrending);
    } catch (error) {
      console.error("Failed to fetch trending content:", error);
      setTrendingSuggestions([]);
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
      try {
        const movieResults = await getExternalApi(`/search/movie`, {
          query: query,
          language: "en-US",
        });
        const tvResults = await getExternalApi(`/search/tv`, {
          query: query,
          language: "en-US",
        });

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
      } catch (error) {
        console.error("Failed to fetch search suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [processTmdbItem]
  );

  useEffect(() => {
    if (show && !searchQuery.trim()) {
      fetchTrendingContent();
      setSuggestions([]);
    } else if (show && searchQuery.trim()) {
      const handler = setTimeout(() => {
        searchContent(searchQuery);
      }, 300);

      return () => {
        clearTimeout(handler);
      };
    } else {
      setSearchQuery("");
      setSuggestions([]);
      setTrendingSuggestions([]);
      setLoading(false);
    }
  }, [show, searchQuery, fetchTrendingContent, searchContent]);

  const handleSuggestionClick = () => {
    onHide();
    setSearchQuery("");
    setSuggestions([]);
    setTrendingSuggestions([]);
  };

  const displaySuggestions = searchQuery.trim()
    ? suggestions
    : trendingSuggestions;
  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <Modal
      show={show}
      onHide={onHide}
      dialogClassName="modal-top"
      className="modal-search"
    >

      <Modal.Body>
        <Form onSubmit={(e) => e.preventDefault()}>
          <InputGroup className="bg-dark text-white">
            <InputGroup.Text id="basic-search">
              <FontAwesomeIcon icon={faSearch} />
            </InputGroup.Text>
            <Form.Control
              className="transparent-input text-white"
              ref={searchInputRef}
              type="search"
              placeholder="Cari berdasarkan judul atau kata kunci terkait..."
              value={searchQuery}
              aria-describedby="basic-search"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Form>

        {loading && (
          <div className="text-center text-white mb-3 mt-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Memuat saran...</span>
            </Spinner>
          </div>
        )}

        {!loading && searchQuery.trim() && suggestions.length === 0 && (
          <p className="text-center text-white mt-3">
            Hasil pencarian tidak ditemukan.
          </p>
        )}

        {!loading &&
          !searchQuery.trim() &&
          trendingSuggestions.length === 0 && (
            <p className="text-center text-white mt-3">
              Tidak ada konten tren yang tersedia.
            </p>
          )}

        {!loading && displaySuggestions.length > 0 && (
          <div className="list-group mt-3">
            {!isSearchActive && (
              <h6 className="px-3 pb-2 text-white">Sedang Tren Minggu Ini</h6>
            )}
            {displaySuggestions.map((item) => (
              <Link
                href={`/stream/${item.media_type}/${item.id}/${item.slug}`}
                key={item.id + item.media_type}
                className="list-group-item list-group-item-action d-flex align-items-center py-2 cursor-pointer"
                onClick={handleSuggestionClick}
              >
                {item.poster_path ? (
                  <Image
                    src={`${TMDB_IMAGE_BASE_URL}${THUMBNAIL_SIZE}${item.poster_path}`}
                    alt={item.title}
                    width={parseInt(THUMBNAIL_SIZE.replace("w", ""))}
                    height={Math.round(
                      parseInt(THUMBNAIL_SIZE.replace("w", "")) * 1.5
                    )}
                    className="me-3 rounded"
                    style={{ objectFit: "cover" }}
                    priority={false}
                  />
                ) : (
                  <div
                    className="me-3 rounded bg-secondary d-flex align-items-center justify-content-center text-white-50"
                    style={{
                      width: parseInt(THUMBNAIL_SIZE.replace("w", "")),
                      height: Math.round(
                        parseInt(THUMBNAIL_SIZE.replace("w", "")) * 1.5
                      ),
                      fontSize: "0.75rem",
                      flexShrink: 0,
                    }}
                  >
                    No Image
                  </div>
                )}
              
              </Link>
            ))}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default SearchModal;
