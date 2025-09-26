"use client";

import React, { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Script from "next/script";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import { Swiper, SwiperSlide } from "swiper/react";

import Modals from "./Modals";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import slugify from "slugify";

const MovieCarousel = ({ initialData }) => {
  const [movies, setMovies] = useState(initialData || []);
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

  const handleFavoriteClick = useCallback((e, movie, mediaType) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const storedBookmarks = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      const bookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : [];

      const isAlreadyBookmarked = bookmarks.some(
        (bookmark) => bookmark.id === movie.id
      );

      if (isAlreadyBookmarked) {
        return;
      }

      const releaseDate = movie.release_date || movie.first_air_date;
      const ryear = releaseDate ? format(parseISO(releaseDate), "yyyy") : "";

      const movietitle = movie.title || movie.name;
      const title = ryear ? `${movietitle} (${ryear})` : movietitle;
      const posterUrl = `${"https://image.tmdb.org/t/p/"}w200${
        movie.poster_path
      }`;

      const bookmarkData = {
        id: movie.id,
        title: title,
        media_type: mediaType,
        year: ryear,
        posterUrl: posterUrl,
      };

      const newBookmarks = [...bookmarks, bookmarkData];
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(newBookmarks));

      window.dispatchEvent(new Event("bookmarksUpdated"));
    } catch (error) {
      console.error("Failed to add to bookmarks:", error);
    }
  }, []);

  return (
    <>
      <div className="top-slider background-black mx-0 mx-sm-5">
    
        <div className="container-fluid p-1 p-sm-0">
          <h3 className="category-title">10 Film Trending Teratas</h3>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            className="mySwiper movie-carousel-container top-10-movie-carousel-list top-10-swiper"
            autoplay={{
              delay: 10000,
              disableOnInteraction: false,
            }}
            navigation
            preventClicks={true}
            preventClicksPropagation={true}
            slidesPerView={"auto"}
          >
            {movies.length > 0 ? (
              movies.map((movie, index) => {
                const movieTitle = movie.title || movie.name;
                const movieSlug = createSlug(movieTitle);
                const mediaType = movie.media_type;

                return (
                  <SwiperSlide
                    key={movie.id}
                    className="movie-container movie-link-with-counter"
                  >
                    <div className="movie-number">
                      <span>{index + 1}</span>
                    </div>
                    <div className="movie-img position-relative">
                      <Link
                        href={`/stream/${mediaType}/${movie.id}/${movieSlug}`}
                        title={movieTitle}
                      >
                        <Image
                          src={
                            movie.poster_path
                              ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
                              : "/images/placeholder.webp"
                          }
                          alt={movieTitle}
                          className="img-fluid"
                          width={isMobile ? 71.3 : 218}
                          height={isMobile ? 107 : 308}
                          priority={index < 5}
                          // lazy="true"
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
            ) : (
              <SwiperSlide>
                <p className="text-white text-center w-100">
                  Tidak ada item ditemukan.
                </p>
              </SwiperSlide>
            )}
          </Swiper>
        </div>
      </div>
      <Modals
        show={showModal}
        onHide={handleCloseModal}
        movieTitleToDisplay={selectedMovieTitle}
      />
    </>
  );
};

export default MovieCarousel;
