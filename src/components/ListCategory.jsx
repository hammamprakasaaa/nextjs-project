"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Script from "next/script";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFire,
  faSearch,
  faBookmark,
} from "@fortawesome/free-solid-svg-icons";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, FreeMode } from "swiper/modules";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

import MovieAdDisplay from "@/components/MovieAdDisplay";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Modals from "./Modals";
import slugify from "slugify";

const ListCategory = ({ initialData, filterCategory, mediaType }) => {
  const [movies, setMovies] = useState(initialData || []);
  const [error, setError] = useState(null);

  const [movieListAd, setMovieListAd] = useState([]);
  const [horizontalAd, setHorizontalAd] = useState([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMovieTitle, setSelectedMovieTitle] = useState(null);

  const isMobile = useMediaQuery(768);

  const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w300";
  const TMDB_IMAGE_BOOKMARK_BASE_URL = "https://image.tmdb.org/t/p/";
  const BOOKMARKS_STORAGE_KEY = "userBookmarks";

  const handleShowModal = useCallback((movieTitle) => {
    setSelectedMovieTitle(movieTitle);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedMovieTitle(null);
  }, []);

  const getCategoryTitle = useCallback(
    (lang = "en") => {
      const titles = {
        en: {
          movie_upcoming: "UPCOMING MOVIES",
          movie_top_rated: "TOP RATED MOVIES",
          movie_popular: "POPULAR MOVIES",
          movie_now_playing: "NOW PLAYING MOVIES",
          tv_on_the_air: "TV SERIES ON AIR",
          tv_popular: "POPULAR TV SERIES",
          tv_top_rated: "TOP RATED TV SERIES",
          tv_airing_today: "TV SERIES AIRING TODAY",
        },
        id: {
          movie_upcoming: "FILM AKAN DATANG",
          movie_top_rated: "FILM TERATAS",
          movie_popular: "FILM POPULER",
          movie_now_playing: "FILM SEDANG TAYANG",
          tv_on_the_air: "SERIAL TV TAYANG",
          tv_popular: "SERIAL TV POPULER",
          tv_top_rated: "SERIAL TV TERATAS",
          tv_airing_today: "SERIAL TV HARI INI",
        },
      };
      const key = `${mediaType}_${filterCategory}`;
      return titles[lang][key] || "JELAJAHI KONTEN";
    },
    [mediaType, filterCategory]
  );

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

  const fetchAds = useCallback(async () => {
    setLoadingAds(true);
    const movieListLocationSectionA = ["A2", "A7", "A12", "A17", "A22", "A27"];
    const movieListLocationSectionB = ["B4", "B8", "B14", "B19", "B24", "B29"];

    let adLocationsToFetch = [];
    if (
      (mediaType === "movie" &&
        (filterCategory === "upcoming" || filterCategory === "popular")) ||
      (mediaType === "tv" &&
        (filterCategory === "on_the_air" || filterCategory === "top_rated"))
    ) {
      adLocationsToFetch = movieListLocationSectionB;
    } else {
      adLocationsToFetch = movieListLocationSectionA;
    }

    const requests = [
      {
        page: "Home",
        adsSize: "Movie List",
        adsLocation: "Movie List",
        movieListLocation: adLocationsToFetch,
      },
    ];
    try {
      const params = new URLSearchParams({
        requests: JSON.stringify(requests),
      });
      const response = await fetch(`/api/movie-ads?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.success)
        throw new Error(result.message || "Failed to fetch ads");

      const movieListAdData = result.results.find(
        (r) => r.criteria.adsSize === "Movie List"
      )?.data;

      setMovieListAd(movieListAdData || []);
    } catch (err) {
      console.error("Error fetching ad data:", err);
    } finally {
      setLoadingAds(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const displayTitle = getCategoryTitle("id");

  const combinedList = useMemo(() => {
    const out = [];

    const positionsMap = {
      sectionA: [1, 6, 11, 16, 21, 26], 
      sectionB: [3, 7, 13, 18, 23, 28], 
    };

    const useA =
      (mediaType === "movie" &&
        (filterCategory === "upcoming" || filterCategory === "popular")) ||
      (mediaType === "tv" &&
        (filterCategory === "on_the_air" || filterCategory === "top_rated"));

    const adPositions = useA ? positionsMap.sectionB : positionsMap.sectionA;

    let adPosIdx = 0;
    let adIdx = 0;

    for (let i = 0; i < movies.length; i++) {
      out.push({ type: "movie", data: movies[i], key: movies[i].id });

      if (
        adPosIdx < adPositions.length &&
        out.length === adPositions[adPosIdx]
      ) {
        if (movieListAd[adIdx]) {
          out.push({
            type: "ad",
            data: movieListAd[adIdx],
            key: `ad-${movieListAd[adIdx].id ?? adIdx}-${adIdx}`,
          });
          adIdx++;
        }
        adPosIdx++;
      }
    }

    while (adIdx < movieListAd.length) {
      out.push({
        type: "ad",
        data: movieListAd[adIdx],
        key: `ad-${movieListAd[adIdx].id ?? adIdx}-${adIdx}`,
      });
      adIdx++;
    }

    return out;
  }, [movies, movieListAd, filterCategory, mediaType]);

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

  const handleFavoriteClick = useCallback((e, movie, mediaType) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const storedBookmarks = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      const bookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : [];

      const releaseDate = movie.release_date || movie.first_air_date;
      const ryear = releaseDate
        ? new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(
            parseISO(releaseDate)
          )
        : "";

      const movietitle = movie.title || movie.name;

      const title = ryear ? `${movietitle} (${ryear})` : movietitle;

      const isAlreadyBookmarked = bookmarks.some(
        (bookmark) => bookmark.id === movie.id
      );

      if (!isAlreadyBookmarked) {
        const bookmarkData = {
          id: movie.id,
          title: title,
          media_type: mediaType,
          year: (movie.release_date || "").substring(0, 4),
          posterUrl: `${TMDB_IMAGE_BOOKMARK_BASE_URL}w200${movie.poster_path}`,
        };
        const newBookmarks = [...bookmarks, bookmarkData];
        localStorage.setItem(
          BOOKMARKS_STORAGE_KEY,
          JSON.stringify(newBookmarks)
        );

        window.dispatchEvent(new Event("bookmarksUpdated"));
      } else {
      }
    } catch (error) {
      console.error("Failed to add to bookmarks:", error);
    }
  }, []);

  return (
    <div className="mx-0 mx-sm-5">
  
      <div className="container-fluid mt-2 mb-3 mb-sm-5 p-1 p-sm-0">
        <div className="movie-category-no-border">
          <h3 className="category-title m-0">
            {displayTitle
              .toLowerCase()
              .replace(/\b\w/g, (char) => char.toUpperCase())}
          </h3>
          <Link
            href={`/filter?mediaType=${mediaType}&category=${filterCategory}`}
            className="theme-black-btn"
          >
            Semua
          </Link>
        </div>

        {error && <p className="text-danger">{error}</p>}

        <Swiper
          modules={[Navigation, Pagination, Autoplay, FreeMode]}
          className="mySwiper movie-carousel-container movie-carousel-list"
          navigation={true}
          preventClicks={true}
          preventClicksPropagation={true}
          slidesPerView={"auto"}
        >
          {combinedList.length === 0 ? (
            <SwiperSlide>
              <h4>Tidak ada konten yang ditemukan.</h4>
            </SwiperSlide>
          ) : (
            combinedList.map((item) => {
              if (item.type === "ad") {
                return (
                  <SwiperSlide key={item.key}>
                    <div className="movie-container">
                      <a
                        href={item.data?.ads_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={item.data?.ads_name}
                      >
                        <img
                          src={
                            item.data?.ads_image_url
                              ? `${item.data?.ads_image_url}`
                              : "/images/placeholder.png"
                          }
                          alt={item.data?.ads_name}
                          className="slide-image-list"
                          width={isMobile ? 90 : 218}
                          height={isMobile ? 130 : 308}
                        />
                      </a>
                    </div>
                  </SwiperSlide>
                );
              } else {
                const movie = item.data;
                const movieTitle = movie.title || movie.name;
                const movieSlug = createSlug(movieTitle);

                return (
                  <SwiperSlide key={movie.id}>
                    <div className="movie-container" tabIndex="0">
                      <div className="add-bookmark-btn">
                        <button
                          className="btn btn-secondary btn-custom-gray rounded-pill"
                          aria-label="Add to bookmarks"
                          title="Add to bookmarks"
                          onClick={(e) =>
                            handleFavoriteClick(e, movie, mediaType)
                          }
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
                          alt={movie.title || movie.name}
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
                          <span>{movie.title || movie.name}</span>
                        </Link>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              }
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

export default ListCategory;
