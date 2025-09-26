"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark, faPlay, faAdd } from "@fortawesome/free-solid-svg-icons";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import Modals from "./Modals";
import { Navigation, Pagination, Autoplay, FreeMode } from "swiper/modules";
import slugify from "slugify";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const PageHero = ({ initialData }) => {
  const [movies, setMovies] = useState(initialData || []);
  const [showModal, setShowModal] = useState(false);
  const [selectedMovieTitle, setSelectedMovieTitle] = useState(null);
  const [heroAd, setHeroAd] = useState(null);

  const isMobile = useMediaQuery(768);

  const BACKDROP_SIZE = "w1280"; //original
  const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";
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

  async function fetchPageAds() {
    const requests = [{ page: "Home", adsSize: "Hero", adsLocation: "Hero" }];

    try {
      const params = new URLSearchParams({
        requests: JSON.stringify(requests),
      });
      const response = await fetch(`/api/movie-ads?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch ads");

      const result = await response.json();
      if (!result.success) throw new Error(result.message || "API failed");

      const ads = result.results
        .filter((r) => r.criteria.adsLocation === "Hero")
        .flatMap((r) => r.data || []);

      return { ads };
    } catch (error) {
      console.error("Ad fetch failed:", error);
      return { ads: [] };
    }
  }

  useEffect(() => {
    const loadAd = async () => {
      const { ads } = await fetchPageAds();
      if (ads.length > 0) {
        setHeroAd(ads[0]);
      }
    };
    loadAd();
  }, []);

  const handleFavoriteClick = useCallback((e, movie) => {
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
          media_type: movie.media_type,
          year: (movie.release_date || "").substring(0, 4),
          posterUrl: `${TMDB_IMAGE_BASE_URL}w200${movie.poster_path}`,
        };
        const newBookmarks = [...bookmarks, bookmarkData];
        localStorage.setItem(
          BOOKMARKS_STORAGE_KEY,
          JSON.stringify(newBookmarks)
        );
        window.dispatchEvent(new Event("bookmarksUpdated"));
      }
    } catch (error) {
      console.error("Failed to add to bookmarks:", error);
    }
  }, []);

  const moviesWithOverview = movies.filter(
    (movie) => movie.overview && movie.poster_path
  );

  let swiperSlides = [...moviesWithOverview];

  if (heroAd) {
    const insertionIndex = Math.min(3, swiperSlides.length);
    swiperSlides.splice(insertionIndex, 0, heroAd);
  }

  return (
    <>
      <div className="hero-swiper">
        <Swiper
          modules={[Navigation, Pagination, Autoplay, FreeMode]}
          className="mySwiper movie-hero-container"
          loop={true}
          autoplay={{
            delay: 10000,
            disableOnInteraction: false,
          }}
        >
          {swiperSlides.length > 0 ? (
            swiperSlides.map((item, index) => {
              const isAdSlide = item.hasOwnProperty("ads_image_url");

              if (isAdSlide) {
                return (
                  <SwiperSlide key={`ad-${index}`}>
                    <Link
                      href={item.ads_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <picture className="w-100">
                        <source
                          srcSet={`https://wsrv.nl/?url=${item.ads_image_url}&w=360&h=262&fit=cover&output=webp`}
                          media="(max-width: 600px)"
                          type="image/webp"
                        />
                        <img
                          src={item.ads_image_url}
                          alt={item.ads_name}
                          width={1920}
                          height={1080}
                          className="img-fluid w-100 h-auto"
                        />
                      </picture>
                     
                    </Link>
                  </SwiperSlide>
                );
              } else {
                const movieTitle = item.title || item.name;
                const movieSlug = createSlug(movieTitle);
                const releaseDate = item.release_date || item.first_air_date;

                return (
                  <SwiperSlide key={item.id}>
                    <picture className="w-100">
                      <source
                        srcSet={`https://wsrv.nl/?url=${TMDB_IMAGE_BASE_URL}${BACKDROP_SIZE}${item.backdrop_path}&w=360&h=262&fit=cover&output=webp`}
                        media="(max-width: 600px)"
                        type="image/webp"
                      />
                      <img
                        src={`${TMDB_IMAGE_BASE_URL}${BACKDROP_SIZE}${item.backdrop_path}`}
                        alt={item.title || item.name}
                        width={1920}
                        height={1080}
                        className="img-fluid w-100 h-auto"
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                      />
                    </picture>
                   
                    <div className="hero-detail">
                      <h2 className="hero-title">
                        {movieTitle} (
                        {releaseDate
                          ? new Intl.DateTimeFormat("en-US", {
                              year: "numeric",
                            }).format(parseISO(releaseDate))
                          : ""}
                        )
                      </h2>
                      <p className="hero-overview d-none d-sm-block">
                        {item.overview}
                      </p>
                      <div className="hero-buttons">
                        <Link
                          className="btn btn-primary btn-custom-red"
                          title={movieTitle}
                          href={`/stream/${item.media_type}/${item.id}/${movieSlug}`}
                          passHref
                        >
                          <FontAwesomeIcon icon={faPlay} /> Watch
                        </Link>
                        <button
                          className="btn btn-secondary btn-custom-greey"
                          onClick={(e) => handleFavoriteClick(e, item)}
                        >
                          <FontAwesomeIcon icon={faAdd} /> Favorite
                        </button>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              }
            })
          ) : (
            <SwiperSlide>
              <p className="text-white text-center w-100">
                Tidak ada item ditemukan.
              </p>
            </SwiperSlide>
          )}
        </Swiper>
      </div>
    </>
  );
};

export default PageHero;
