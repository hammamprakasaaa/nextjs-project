"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Script from "next/script";
import { format, parseISO } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Link from "next/link";
import Modals from "./Modals";
import slugify from "slugify";
import { getExternalApi } from "@/lib/api";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const fetchGenres = async (mediaType) => {
  try {
    const endpoint = `/genre/${mediaType}/list`;
    const data = await getExternalApi(endpoint, { language: "id-ID" });
    return data.genres || [];
  } catch (error) {
    console.error(`Error fetching ${mediaType} genres:`, error);
    return [];
  }
};

const Trending = ({ initialData, mediaType }) => {
  const [movies, setMovies] = useState(initialData || []);
  const [error, setError] = useState(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [movieListAd, setMovieListAd] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMovieTitle, setSelectedMovieTitle] = useState(null);

  const isMobile = useMediaQuery(768);

  const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w300";
  const BOOKMARKS_STORAGE_KEY = "userBookmarks";

  const handleShowModal = useCallback((movieTitle) => {
    setSelectedMovieTitle(movieTitle);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedMovieTitle(null);
  }, []);

  const createSlug = useCallback((title) => {
    if (!title) return "";
    let slug = slugify(title, {
      lower: true,
      strict: true,
      locale: "en",
    });
    return slug || title.trim().replace(/\s+/g, "-");
  }, []);

  const getCategoryTitle = useMemo(() => {
    const titles = {
      en: { movie: "TRENDING MOVIES", tv: "TRENDING TV SERIES" },
      id: { movie: "FILM TRENDING", tv: "SERIAL TRENDING TV" },
    };
    const selectedLang = titles.id || titles.en;
    return selectedLang[mediaType] || "BROWSE CONTENT";
  }, [mediaType]);

  const handleFavoriteClick = useCallback(
    (e, movie) => {
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
          media_type: mediaType,
          year: ryear,
          posterUrl: `https://image.tmdb.org/t/p/w200${movie.poster_path}`,
        };
        const newBookmarks = [...bookmarks, bookmarkData];
        localStorage.setItem(
          BOOKMARKS_STORAGE_KEY,
          JSON.stringify(newBookmarks)
        );
        window.dispatchEvent(new Event("bookmarksUpdated"));
      } catch (error) {
        console.error("Failed to add to bookmarks:", error);
      }
    },
    [mediaType]
  );

  const combinedList = useMemo(() => {
    const list = [];

    const finalAdPositions = {
      movie: [2, 7, 12, 17, 22, 27],
      tv: [4, 8, 14, 19, 24, 29],
    };

    const adPos =
      mediaType === "movie" ? finalAdPositions.movie : finalAdPositions.tv;

    let iMovie = 0; 
    let iAd = 0; 
    let pos = 1; 

    while (iMovie < movies.length) {
      if (iAd < movieListAd.length && adPos.includes(pos)) {
        const ad = movieListAd[iAd++];
        list.push({ type: "ad", data: ad, key: `ad-${ad.id}-${iAd}` });
      } else {
        const m = movies[iMovie++];
        list.push({ type: "movie", data: m, key: m.id });
      }
      pos++;
    }

    while (iAd < movieListAd.length) {
      const ad = movieListAd[iAd++];
      list.push({ type: "ad", data: ad, key: `ad-${ad.id}-${iAd}` });
    }

    return list;
  }, [movies, movieListAd, mediaType]);

  const genreMap = useMemo(() => {
    return genres.reduce((map, genre) => {
      map[genre.id] = genre.name;
      return map;
    }, {});
  }, [genres]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const genreList = await fetchGenres(mediaType);
        setGenres(genreList);

        let movieResults = initialData;
        if (selectedGenre) {
          const endpoint = `/discover/${mediaType}`;
          const params = { with_genres: selectedGenre, language: "en-US" };
          const data = await getExternalApi(endpoint, params);
          movieResults = data.results || [];
        }

        const genreMap = genreList.reduce((map, genre) => {
          map[genre.id] = genre.name;
          return map;
        }, {});

        const moviesWithGenreNames = movieResults.map((movie) => ({
          ...movie,
          genreNames: (movie.genre_ids || [])
            .map((id) => genreMap[id])
            .filter(Boolean)
            .join(", "),
        }));
        setMovies(moviesWithGenreNames);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Gagal memuat konten.");
      }
    };
    loadData();
  }, [selectedGenre, mediaType, initialData]);

  const stableMediaType = useMemo(() => mediaType, [mediaType]);

  useEffect(() => {
    const fetchAds = async () => {
      const categoryTitle =
        mediaType === "movie" ? "TRENDING MOVIES" : "TRENDING TV SERIES";
      const movieListLocationSectionA = [
        "A2",
        "A7",
        "A12",
        "A17",
        "A22",
        "A27",
      ];
      const movieListLocationSectionB = [
        "B4",
        "B8",
        "B14",
        "B19",
        "B24",
        "B29",
      ];

      const selectedMovieListLocation =
        mediaType === "movie"
          ? movieListLocationSectionA
          : movieListLocationSectionB;

      const requestPayload = [
        {
          page: "Home",
          adsSize: "Movie List",
          adsLocation: "Movie List",
          movieListLocation: selectedMovieListLocation,
        },
      ];
      try {
        const params = new URLSearchParams({
          requests: JSON.stringify(requestPayload),
        });
        const response = await fetch(`/api/movie-ads?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch ads");
        const result = await response.json();
        const movieListAdData =
          result.results.find((r) => r.criteria.adsSize === "Movie List")
            ?.data || [];
        setMovieListAd(movieListAdData);
      } catch (err) {
        console.error("Error fetching ad data:", err);
        setMovieListAd([]);
      }
    };
    fetchAds();
  }, [stableMediaType]);

  const renderGenreTooltip = useCallback(
    (genreNames, releaseDate) => (props) =>
      (
        <Tooltip {...props}>
          <div>
            <small className="color-yellow">Genre:</small>{" "}
            <small>{genreNames}</small>
          </div>
          {releaseDate && (
            <div>
              <small className="color-yellow">Tanggal Rilis:</small>{" "}
              <small>
                {new Intl.DateTimeFormat("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }).format(new Date(releaseDate))}
              </small>
            </div>
          )}
        </Tooltip>
      ),
    []
  );

  return (
    <div className="mx-0 mx-sm-5">
      <div className="container-fluid mb-3 mb-sm-5 p-1 p-sm-0">
        <div className="movie-category-no-border">
          <h3 className="category-title m-0">
            {getCategoryTitle
              .toLowerCase()
              .replace(/\b\w/g, (char) => char.toUpperCase())}
          </h3>
          <Link
            href={`/filter?trending=${mediaType}`}
            className="btn theme-black-btn"
          >
            Semua
          </Link>
        </div>
        <div className="mb-3 trending-genre-filter">
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGenre(g.id)}
              className={`btn btn-sm btn-custom-genre ${
                selectedGenre === g.id ? "btn-custom-white" : "btn-custom-grey"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {error && <p className="text-danger">{error}</p>}

        <Swiper
          modules={[Navigation, Pagination]}
          className="mySwiper movie-carousel-container movie-carousel-list"
          navigation
          spaceBetween={0}
          preventClicks={true}
          preventClicksPropagation={true}
          slidesPerView={"auto"}
        
        >
          {combinedList.length === 0 ? (
            <SwiperSlide>
              <h4>Tidak ada konten tren yang ditemukan.</h4>
            </SwiperSlide>
          ) : (
            combinedList.map((item) => {
              if (item.type === "ad") {
                const ad = item.data;
                return (
                  <SwiperSlide key={item.key}>
                    <div className="movie-container">
                      <a
                        href={ad?.ads_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={ad?.ads_name}
                      >
                        <img
                          src={ad?.ads_image_url || "/images/placeholder.png"}
                          alt={ad?.ads_name || "Advertisement"}
                          className="slide-image-list"
                          width={isMobile ? 90 : 218}
                          height={isMobile ? 130 : 308}
                        />
                      </a>

                    </div>
                  </SwiperSlide>
                );
              }

              const movie = item.data;
              const movieTitle = movie.title || movie.name;
              const movieSlug = createSlug(movieTitle);

              const genreNames = (movie.genre_ids || [])
                .map((id) => genreMap[id])
                .filter(Boolean)
                .join(", ");

              return (
                <SwiperSlide key={movie.id}>
                 
                  <div className="movie-container" tabIndex="0">
                    <div className="add-bookmark-btn">
                      <button
                        className="btn btn-secondary btn-custom-gray rounded-pill"
                        onClick={(e) => handleFavoriteClick(e, movie)}
                        aria-label="Add to bookmarks"
                        title="Add to bookmarks"
                      >
                        <FontAwesomeIcon icon={faBookmark} />
                      </button>
                    </div>
                    <Link
                      href={`/stream/${mediaType}/${movie.id}/${movieSlug}`}
                      title={movieTitle}
                    >
                      <Image
                        src={
                          movie.poster_path
                            ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
                            : "/images/placeholder.png"
                        }
                        alt={movieTitle}
                        className="slide-image-list"
                        width={isMobile ? 90 : 218}
                        height={isMobile ? 130 : 308}
                        priority
                        quality={75}
                      />
                    </Link>
                    <div className="movie-title">
                      <Link
                        href={`/stream/${mediaType}/${movie.id}/${movieSlug}`}
                        title={movieTitle}
                        style={{ textDecoration: "none" }}
                      >
                        <span>{movieTitle}</span>
                      </Link>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })
          )}
        </Swiper>
      </div>
      <Modals
        show={showModal}
        onHide={handleCloseModal}
        movieTitleToDisplay={selectedMovieTitle}
      />
    </div>
  );
};

export default Trending;
