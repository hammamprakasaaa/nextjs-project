"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Script from "next/script";
import Head from "next/head";
import slugify from "slugify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFire,
  faPlay,
  faForward,
  faBookmark,
  faFilm,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import Modals from "@/components/Modals";
import { format, parseISO } from "date-fns";
import { getExternalApi } from "@/lib/api";
import { getVidsrcEmbedUrl } from "@/lib/vidsrc";
import { Dropdown, Spinner, Row, Col, Button } from "react-bootstrap";
import Accordion from "react-bootstrap/Accordion";
import FBComments from "@/components/FBComments";
import MovieAdDisplay from "@/components/MovieAdDisplay";
import StreamAdsSlider from "@/components/StreamAdsSlider";
import StreamVideoBanners from "@/components/StreamVideoBanners";
import StreamCenterBanner from "./StreamCenterBanner";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";
const POSTER_SIZE = "w300";
const BACKDROP_SIZE = "w1280";
const TMDB_IMAGE_BOOKMARK_BASE_URL = "https://image.tmdb.org/t/p/";
const BOOKMARKS_STORAGE_KEY = "userBookmarks";

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};



const MovieInteraction = ({
  mediaDetails,
  mediaType,
  initialSeason,
  initialEpisode,
  seasonsData,
  initialSEOData,
}) => {
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [movieTitleForModal, setMovieTitleForModal] = useState("");
  const [currentStreamUrl, setCurrentStreamUrl] = useState(null);

  const [isBookmarked, setIsBookmarked] = useState(false);

  const [selectedSeasonNumber, setSelectedSeasonNumber] =
    useState(initialSeason);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] =
    useState(initialEpisode);

  const [verticalAd, setVerticalAd] = useState([]);
  const [horizontalAd, setHorizontalAd] = useState([]);
  const [horizontalBottomAd, setHorizontalBottomAd] = useState([]);
  const [loadingImageAds, setLoadingImageAds] = useState(true);

  const adVideoRef = useRef(null);
  const [videoAds, setVideoAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [currentAdData, setCurrentAdData] = useState(null);
  const [currentAdVideoSrc, setCurrentAdVideoSrc] = useState(null);
  const [showAdPlayer, setShowAdPlayer] = useState(false);
  const [isLoadingVideoAds, setIsLoadingVideoAds] = useState(true);
  const [showSkipAdButton, setShowSkipAdButton] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const adTimerId = useRef(null);

  const playMainContentRef = useRef();
  const playNextAdRef = useRef();

  const [activeKey, setActiveKey] = useState("0");

  const [seoContent, setSeoContent] = useState(null);

  const toggleAccordion = () => {
    setActiveKey(activeKey === "0" ? null : "0");
  };

  const fetchEpisodesForSeason = useCallback(
    async (seasonNum, episodeToSelect = null) => {
      if (!mediaDetails.id || seasonNum === null || seasonNum === undefined)
        return;
      setLoadingEpisodes(true);
      try {
        const data = await getExternalApi(
          `/tv/${mediaDetails.id}/season/${seasonNum}`,
          { language: "en-US" }
        );
        const sortedEpisodes =
          data.episodes?.sort((a, b) => a.episode_number - b.episode_number) ||
          [];
        setEpisodes(sortedEpisodes);

        let episodeNumToPlay =
          sortedEpisodes.length > 0 ? sortedEpisodes[0].episode_number : null;
        if (episodeToSelect !== null) {
          const foundEpisode = sortedEpisodes.find(
            (ep) => ep.episode_number === episodeToSelect
          );
          if (foundEpisode) {
            episodeNumToPlay = foundEpisode.episode_number;
          }
        }
        setSelectedEpisodeNumber(episodeNumToPlay);

        if (episodeNumToPlay !== null) {
          setCurrentStreamUrl(
            getVidsrcEmbedUrl(mediaDetails.id, {
              media: "tv",
              season: seasonNum,
              episode: episodeNumToPlay,
              autoplay: true,
              dsLang: "id",
            })
          );
        } else {
          setCurrentStreamUrl(null);
        }
      } catch (error) {
        console.error(
          `Failed to fetch episodes for season ${seasonNum}:`,
          error
        );
        setEpisodes([]);
        setSelectedEpisodeNumber(null);
        setCurrentStreamUrl(null);
      } finally {
        setLoadingEpisodes(false);
      }
    },
    [mediaDetails.id]
  );

  const fetchImageAds = useCallback(async () => {
    if (!mediaDetails?.id) {
      setLoadingImageAds(false);
      return;
    }
    setLoadingImageAds(true);
    const requests = [
      {
        page: "Stream",
        adsSize: "Vertical",
        adsLocation: "Top",
        movieListLocation: null,
      },
      {
        page: "Stream",
        adsSize: "Horizontal",
        adsLocation: "Top",
        movieListLocation: null,
      },
      {
        page: "Stream",
        adsSize: "Horizontal",
        adsLocation: "Bottom",
        movieListLocation: null,
      },
    ];
    try {
      const params = new URLSearchParams({
        requests: JSON.stringify(requests),
      });
      const response = await fetch(`/api/movie-ads?${params.toString()}`);
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.results)) {
        throw new Error("Failed to fetch image ads or invalid format.");
      }

      const fetchedVerticalAds =
        result.results.find((r) => r.criteria.adsSize === "Vertical")?.data ||
        [];

      const fetchedHorizontalTopAds =
        result.results.find(
          (r) =>
            r.criteria.adsSize === "Horizontal" &&
            r.criteria.adsLocation === "Top"
        )?.data || [];

      const fetchedHorizontalBottomAds =
        result.results.find(
          (r) =>
            r.criteria.adsSize === "Horizontal" &&
            r.criteria.adsLocation === "Bottom"
        )?.data || [];

      setVerticalAd(
        Array.isArray(fetchedVerticalAds) ? fetchedVerticalAds : []
      );
      setHorizontalAd(
        Array.isArray(fetchedHorizontalTopAds) ? fetchedHorizontalTopAds : []
      );
      setHorizontalBottomAd(
        Array.isArray(fetchedHorizontalBottomAds)
          ? fetchedHorizontalBottomAds
          : []
      );
    } catch (err) {
      console.error("Error fetching batched image ad data:", err);
      setVerticalAd([]);
      setHorizontalAd([]);
      setHorizontalBottomAd([]);
    } finally {
      setLoadingImageAds(false);
    }
  }, [mediaDetails]);

  playMainContentRef.current = useCallback(() => {
    if (adTimerId.current) clearInterval(adTimerId.current);
    setShowSkipAdButton(false);
    setShowAdPlayer(false);
    setCurrentAdData(null);

    if (mediaType === "movie") {
      setCurrentStreamUrl(
        getVidsrcEmbedUrl(mediaDetails.id, {
          media: "movie",
          autoplay: true,
          dsLang: "id",
        })
      );
    } else if (mediaType === "tv") {
      fetchEpisodesForSeason(selectedSeasonNumber, selectedEpisodeNumber);
    }
  }, [
    mediaType,
    mediaDetails.id,
    selectedSeasonNumber,
    selectedEpisodeNumber,
    fetchEpisodesForSeason,
  ]);

  playNextAdRef.current = useCallback(() => {
    if (adTimerId.current) {
      clearInterval(adTimerId.current);
      adTimerId.current = null;
    }
    setAdCountdown(5);
    setShowSkipAdButton(false);

    const nextIndex = currentAdIndex + 1;
    if (nextIndex < videoAds.length) {
      const nextAd = videoAds[nextIndex];
      setCurrentAdIndex(nextIndex);
      setCurrentAdData(nextAd);
      setCurrentAdVideoSrc(nextAd.ads_video);
    } else {
      playMainContentRef.current();
    }
  }, [videoAds, currentAdIndex]);

  const handleAdEnded = useCallback(() => playNextAdRef.current(), []);
  const skipCurrentAd = useCallback(() => {
    if (adVideoRef.current) adVideoRef.current.pause();
    playNextAdRef.current();
  }, []);

  const handleAdError = useCallback(
    (errorEvent) => {
      console.error("An error occurred with the ad video:", errorEvent);
      if (errorEvent?.target?.error) {
        console.error("Video Element Error:", errorEvent.target.error.message);
      } else if (errorEvent?.message) {
        if (errorEvent.name !== "AbortError") {
          console.error("Playback Error:", errorEvent.message);
        }
      }

      playNextAdRef.current();
    },
    [currentAdVideoSrc]
  );

  const fetchAndPlayVideoAds = useCallback(async () => {
    setIsLoadingVideoAds(true);
    setShowAdPlayer(false);
    try {
      const response = await fetch("/api/movie-video-ads?ads_location=Stream");
      const result = await response.json();
      if (
        result.success &&
        Array.isArray(result.data) &&
        result.data.length > 0
      ) {
        const shuffledAds = shuffleArray([...result.data]);
        setVideoAds(shuffledAds);
        setCurrentAdIndex(0);
        setCurrentAdData(shuffledAds[0]);
        setCurrentAdVideoSrc(shuffledAds[0].ads_video);
        setShowAdPlayer(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error fetching video ads:", error);
      return false;
    } finally {
      setIsLoadingVideoAds(false);
    }
  }, []);

  useEffect(() => {
    if (!mediaDetails?.id) return;
    fetchAndPlayVideoAds().then(
      (adsFound) => !adsFound && playMainContentRef.current()
    );
    fetchImageAds();
  }, [mediaDetails?.id, fetchImageAds, fetchAndPlayVideoAds]);

  useEffect(() => {
    const videoElement = adVideoRef.current;

    return () => {
      if (adTimerId.current) {
        clearInterval(adTimerId.current);
        adTimerId.current = null;
      }
      if (videoElement) {
        videoElement.pause();
        videoElement.removeAttribute("src");
        videoElement.load();
        videoElement.currentTime = 0;
        videoElement.removeEventListener("ended", handleAdEnded);
        videoElement.removeEventListener("error", handleAdError);
      }
    };
  }, []);


  useEffect(() => {
    const videoElement = adVideoRef.current;

    if (videoElement) {
      videoElement.pause();
    }

    if (showAdPlayer && currentAdVideoSrc && videoElement) {
      if (adTimerId.current) clearInterval(adTimerId.current);
      setShowSkipAdButton(false);
      setAdCountdown(5);

      videoElement.src = currentAdVideoSrc;
      videoElement.muted = false;

      videoElement.addEventListener("ended", handleAdEnded);
      videoElement.addEventListener("error", handleAdError);

      let playPromise = videoElement.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            adTimerId.current = setInterval(() => {
              setAdCountdown((prev) => {
                if (prev <= 1) {
                  clearInterval(adTimerId.current);
                  setShowSkipAdButton(true);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          })
          .catch((e) => {
            if (e.name !== "AbortError") {
              handleAdError(e);
            }
          });
      }
    }
  }, [showAdPlayer, currentAdVideoSrc, handleAdEnded, handleAdError]);

  const handleShowTrailer = useCallback(() => {
    setMovieTitleForModal(mediaDetails.title || mediaDetails.name);
    setShowTrailerModal(true);
  }, [mediaDetails]);

  const handleCloseTrailer = useCallback(() => setShowTrailerModal(false), []);

  const handleSeasonSelect = useCallback(
    (seasonNum) => {
      const newSeasonNum = parseInt(seasonNum);
      if (newSeasonNum !== selectedSeasonNumber) {
        setSelectedSeasonNumber(newSeasonNum);
        setSelectedEpisodeNumber(null);
        setCurrentStreamUrl(null);
        fetchAndPlayVideoAds().then(
          (adsFound) => !adsFound && fetchEpisodesForSeason(newSeasonNum, null)
        );
      }
    },
    [selectedSeasonNumber, fetchEpisodesForSeason, fetchAndPlayVideoAds]
  );

  const handleEpisodeSelect = useCallback(
    (episodeNum) => {
      const newEpisodeNum = parseInt(episodeNum);
      if (newEpisodeNum !== selectedEpisodeNumber) {
        setSelectedEpisodeNumber(newEpisodeNum);
        setCurrentStreamUrl(null);
        fetchAndPlayVideoAds().then(
          (adsFound) =>
            !adsFound &&
            setCurrentStreamUrl(
              getVidsrcEmbedUrl(mediaDetails.id, {
                media: "tv",
                season: selectedSeasonNumber,
                episode: newEpisodeNum,
                autoplay: true,
                dsLang: "id",
              })
            )
        );
      }
    },
    [
      mediaDetails.id,
      selectedSeasonNumber,
      selectedEpisodeNumber,
      fetchAndPlayVideoAds,
    ]
  );
  useEffect(() => {
    const storedBookmarks = localStorage.getItem("userBookmarks");
    const bookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : [];
    const isAlreadyBookmarked = bookmarks.some(
      (bookmark) => bookmark.id === mediaDetails.id
    );
    setIsBookmarked(isAlreadyBookmarked);
  }, [mediaDetails.id]);

  async function getMetaDetails() {
    try {
      const seoApiUrl = `/api/seostream?movieid=${mediaDetails.id}`;
      const seoResponse = await fetch(seoApiUrl, { cache: "no-store" });

      if (seoResponse.ok) {
        const seoData = await seoResponse.json();
        if (seoData.success && seoData.data && seoData.data.movie_description) {
          return seoData.data.movie_description;
        }
      }
    } catch (error) {
      console.error("Error fetching SEO metadata:", error);
    }
    return null;
  }

  useEffect(() => {
    if (mediaDetails && mediaDetails.id) {
      getMetaDetails().then((data) => setSeoContent(data));
    }
  }, [mediaDetails]);

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
        setIsBookmarked(true);
        window.dispatchEvent(new Event("bookmarksUpdated"));
      } else {
      }
    } catch (error) {
      console.error("Failed to add to bookmarks:", error);
    }
  }, []);

  const formatGenres = (genres) =>
    (genres || []).map((genre, index) => (
      <span key={index} className="badge text-bg-secondary me-1">
        {genre.name}
      </span>
    ));

  const formatList = (items) =>
    items && items.length > 0
      ? items.map((item, index) => (
          <span key={index} className="badge text-bg-secondary me-1">
            {item.name}
          </span>
        ))
      : "N/A";
  const formatGenreListLink = (items, mediaType) => {
    if (!items || items.length === 0) {
      return "N/A";
    }

    return items.map((item) => (
      <a
        key={item.id}
        href={`/filter?mediaType=${mediaType}&genreId=${item.id}`}
        className="text-underline text-white"
      >
        {item.name}
      </a>
    ));
  };

  const formatListPlain = (items) =>
    items && items.length > 0
      ? items.map((item, index) => <span key={index}>{item.name}</span>)
      : "N/A";

  const getDirector = (credits) =>
    credits?.crew?.find((c) => c.job === "Director")?.name || "N/A";

  const getTopCast = (credits, count = 5) =>
    credits?.cast && credits.cast.length > 0
      ? credits.cast
          .filter((c) => c && c.name)
          .map((c, index) => (
            <span key={index} className="custom-badge me-1">
              {c.name}
            </span>
          ))
      : "N/A";

  const getContent = () => {
    const content = initialSEOData?.movie_description || mediaDetails?.overview;

    if (!content) {
      return "Tidak ada sinopsis yang tersedia.";
    }

    const htmlTagRegex = /<\/?[a-z][\s\S]*>/i;

    if (typeof content === "string" && htmlTagRegex.test(content)) {
      const safeContent = content.replace(/<a(?![^>]*href=)/gi, '<a href="#"');

      return <div dangerouslySetInnerHTML={{ __html: safeContent }} />;
    }

    return <div>{content}</div>;
  };


  const title = mediaDetails.title || mediaDetails.name;
  const releaseDate = mediaDetails.release_date || mediaDetails.first_air_date;
  const runtime = mediaDetails.runtime || mediaDetails.episode_run_time?.[0];

  return (
    <>
     
      <div className="mx-2 mx-sm-5 movie-stream">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12 p-0">
              <div className="horizontal-ads mt-4 mb-2">
                {!loadingImageAds &&
                  horizontalAd.length > 0 &&
                  horizontalAd.map((ad, index) => (
                    <div
                      className="horizontal-item"
                      key={ad.id || `top-ad-${index}`}
                    >
                      <MovieAdDisplay
                        adData={ad}
                        imageWidth="532.61"
                        imageHeight="131.48"
                        altText={ad.ads_name || `Vertical Ad ${index + 1}`}
                      />
                    </div>
                  ))}
              </div>
            </div>
            <div className="col-md-12 p-0">
              <div
                className="video-wrapper"
                style={{
                  position: "relative",
                  paddingBottom: "56.25%",
                  height: 0,
                  overflow: "hidden",
                }}
              >
                {isLoadingVideoAds ? (
                  <div
                    className="d-flex justify-content-center align-items-center text-center bg-dark text-white"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      flexDirection: "column",
                    }}
                  >
                    <Spinner animation="border" variant="primary" role="status">
                      <span className="visually-hidden">Memuat konten...</span>
                    </Spinner>
                    <p className="mt-2">Memuat konten...</p>
                  </div>
                ) : showAdPlayer && currentAdVideoSrc ? (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <a
                      href={currentAdData.ads_video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <video
                        key={currentAdVideoSrc}
                        ref={adVideoRef}
                        src={currentAdVideoSrc}
                        autoPlay
                        onEnded={handleAdEnded}
                        onError={handleAdError}
                        className="ad-video"
                        playsInline
                        style={{ width: "100%", height: "100%" }}
                      />
                    </a>

                    {adCountdown > 0 ? (
                      <Button className="btn-warning btn-sm btn-next" disabled>
                        Lewati dalam ({adCountdown}s)
                      </Button>
                    ) : (
                      showSkipAdButton && (
                        <Button
                          onClick={skipCurrentAd}
                          className="btn-danger btn-sm btn-skip"
                        >
                          Lewati Iklan <FontAwesomeIcon icon={faForward} />
                        </Button>
                      )
                    )}
                    {currentAdData?.ads_video_url && (
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          right: "10px",
                          transform: "translateY(-50%)",
                          zIndex: 5,
                          backgroundColor: "rgba(0, 0, 0, 0.6)",
                          borderRadius: "5px",
                          textAlign: "center",
                          maxWidth: "calc(50% - 30px)",
                          wordBreak: "break-word",
                        }}
                      >
                        <a
                          href={currentAdData.ads_video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-join"
                        >
                          Daftar jadi anggota!
                        </a>
                      </div>
                    )}
                  </div>
                ) : currentStreamUrl ? (
                  <div
                    className="position-relative"
                    style={{ width: "100%", paddingTop: "56.25%" }}
                  >
                    <iframe
                      src={currentStreamUrl}
                      title={`Stream ${title}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 1,
                      }}
                    ></iframe>
                    <StreamVideoBanners />
                  </div>
                ) : (
                  <div
                    className="d-flex justify-content-center align-items-center text-center bg-dark text-white"
                    style={{
                      height: "100%",
                      width: "100%",
                      position: "absolute",
                      top: 0,
                      left: 0,
                    }}
                  >
                    <p>
                      {loadingEpisodes
                        ? "Memuat episode..."
                        : "Pilih musim dan episode untuk memulai."}
                    </p>
                  </div>
                )}
              </div>
              {showAdPlayer && currentAdData?.ads_image && (
                <div
                  style={{
                    position: "relative",
                    zIndex: 15,
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    textAlign: "center",
                  }}
                >
                  <a
                    href={currentAdData.ads_image_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "block", cursor: "pointer" }}
                  >
                    <img
                      src={currentAdData.ads_image}
                      alt={currentAdData.ads_name || "Iklan"}
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                        maxHeight: "100px",
                        objectFit: "cover",
                      }}
                    />
                  </a>
                </div>
              )}
            </div>
          </div>
          {mediaType === "tv" &&
            selectedSeasonNumber &&
            selectedEpisodeNumber && (
              <div
                className="text-white text-center py-2 mt-2"
                style={{ backgroundColor: "#333", borderRadius: "5px" }}
              >
                Sedang diputar:{" "}
                <span className="color-yellow">
                  Musim {selectedSeasonNumber}
                </span>
                ,{" "}
                <span className="color-yellow">
                  Episode {selectedEpisodeNumber}
                </span>
              </div>
            )}
        </div>
        <StreamAdsSlider />
        {mediaType === "tv" && seasonsData.length > 0 && (
          <div className="container-fluid mt-4 mb-4">
            <Row className="align-items-center justify-content-center">
              <Col xs={12} md={6} className="mb-3 mb-md-0">
                <h4 className="mb-2 text-white text-center">
                  <FontAwesomeIcon icon={faPlay} /> Pilih Musim
                </h4>
                <Dropdown onSelect={handleSeasonSelect} data-bs-theme="dark">
                  <Dropdown.Toggle
                    variant="secondary"
                    id="dropdown-season"
                    className="w-100"
                    size="lg"
                  >
                    Musim {selectedSeasonNumber || "Select"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100 dropdown-menu-scrollable">
                    {seasonsData.map((season) => (
                      <Dropdown.Item
                        key={season.id}
                        eventKey={season.season_number}
                        active={season.season_number === selectedSeasonNumber}
                      >
                        {season.name} ({season.episode_count} Episode)
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
              <Col xs={12} md={6}>
                <h4 className="mb-2 text-white text-center">
                  <FontAwesomeIcon icon={faFilm} /> Pilih Episode
                </h4>
                <Dropdown onSelect={handleEpisodeSelect} data-bs-theme="dark">
                  <Dropdown.Toggle
                    variant="secondary"
                    id="dropdown-episode"
                    className="w-100"
                    size="lg"
                    disabled={loadingEpisodes || episodes.length === 0}
                  >
                    Episode {selectedEpisodeNumber || "Select"}{" "}
                    {loadingEpisodes && (
                      <Spinner animation="border" size="sm" className="ms-2" />
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100 dropdown-menu-scrollable">
                    {episodes.length > 0 ? (
                      episodes.map((episode) => (
                        <Dropdown.Item
                          key={episode.id}
                          eventKey={episode.episode_number}
                          active={
                            episode.episode_number === selectedEpisodeNumber
                          }
                        >
                          Episode {episode.episode_number}: {episode.name}
                        </Dropdown.Item>
                      ))
                    ) : (
                      <Dropdown.Item disabled>
                        Tidak ada episode untuk musim ini.
                      </Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
          </div>
        )}

        <Accordion
          activeKey={activeKey}
          onSelect={toggleAccordion}
          className="mt-2"
          alwaysOpen
        >
          <Accordion.Item eventKey="0" className="accordion-item">
            <Accordion.Header className="d-flex justify-content-between align-items-center">
              <div className="d-flex justify-content-between align-items-center w-100 gap-1 gap-sm-3">
                <div className="d-flex justify-content-between align-items-center flex-nowrap gap-1 gap-sm-3">
                  <div className="d-flex align-items-center gap-1">
                    <img
                      src={
                        isBookmarked
                          ? "/images/bookmark-check.png"
                          : "/images/bookmark-add.png"
                      }
                      onClick={(e) =>
                        handleFavoriteClick(e, mediaDetails, mediaType)
                      }
                      alt="Bookmark icon"
                    />
                  </div>
                  <h1 className="stream-movie-title text-white mb-0 d-none d-sm-block">
                    {initialSEOData?.movie_title ||
                      `${title} (${
                        releaseDate
                          ? new Intl.DateTimeFormat("en-US", {
                              year: "numeric",
                            }).format(parseISO(releaseDate))
                          : ""
                      })`}
                  </h1>
                  <div className="d-flex align-items-center justify-content-center gap-2">
                    <Image
                      src={`/images/star-yellow.svg`}
                      className="img-fluid rounded shadow"
                      alt={`HD`}
                      width={26}
                      height={26}
                      priority
                    />
                    <h4 className="m-0 stream-votes">
                      {mediaDetails.vote_average?.toFixed(1) || "N/A"}
                    </h4>

                    <small className="stream-votes-2 ms-1">
                      {" "}
                      / 10 ({mediaDetails.vote_count} votes)
                    </small>
                  </div>
                </div>
                <small className="text-white mx-1">
                  {activeKey === "0" ? "Less" : "Read more"}
                </small>
              </div>
            </Accordion.Header>

            <Accordion.Body>
              <div className="row px-2">
                <div className="col-md-12">
                  <div>
                    <div className="stream-movie-title text-white d-block d-sm-none">
                      {initialSEOData?.movie_title ||
                        `${title} (${
                          releaseDate
                            ? new Intl.DateTimeFormat("en-US", {
                                year: "numeric",
                              }).format(parseISO(releaseDate))
                            : ""
                        })`}
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-2 d-flex align-items-start text-center">
                  {mediaDetails.poster_path ? (
                    <Image
                      src={`${TMDB_IMAGE_BASE_URL}${POSTER_SIZE}${mediaDetails.poster_path}`}
                      className="img-fluid rounded shadow"
                      alt={`${title} Poster`}
                      width={247.08}
                      height={348}
                      priority
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                  ) : (
                    <div
                      className="bg-light d-flex align-items-center justify-content-center text-muted rounded shadow"
                      style={{ width: 300, height: 450, borderRadius: "8px" }}
                    >
                      Tidak ada Poster
                    </div>
                  )}
                </div>

                <div className="col-md-5 text-white">
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="d-flex align-items-center gap-4 p-2">
                      <p className="m-0 font-size-14">
                        {" "}
                        Year{" "}
                        {releaseDate
                          ? new Intl.DateTimeFormat("en-US", {
                              year: "numeric",
                            }).format(parseISO(releaseDate))
                          : ""}{" "}
                      </p>

                      <div className="d-flex gap-1">
                        <Image
                          src={`/images/13plus.png`}
                          className="img-fluid"
                          alt={`HD`}
                          width={22}
                          height={22}
                          priority
                        />
                        <p className="m-0 font-size-14">
                          {" "}
                          {runtime
                            ? (() => {
                                const hours = Math.floor(runtime / 60);
                                const mins = runtime % 60;
                                return [
                                  hours > 0
                                    ? `${hours} hr${hours > 1 ? "s" : ""}`
                                    : "",
                                  mins > 0
                                    ? `${mins} min${mins > 1 ? "s" : ""}`
                                    : "",
                                ]
                                  .filter(Boolean)
                                  .join(" ");
                              })()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-1 gap-sm-3 p-2">
                      <Image
                        src={`/images/hd.png`}
                        className="img-fluid rounded shadow"
                        alt={`HD`}
                        width={30}
                        height={30}
                        priority
                      />
                      <div className="d-flex gap-1 align-items-center">
                        {Array.from({ length: 10 }).map((_, index) => {
                          const isFilled =
                            index < Math.round(mediaDetails.vote_average);
                          const starSrc = isFilled
                            ? "/images/star-yellow.svg"
                            : "/images/star-white.svg";

                          return (
                            <Image
                              key={index}
                              src={starSrc}
                              className="img-fluid"
                              alt={`${isFilled ? "Filled" : "Empty"} star`}
                              width={16}
                              height={16}
                              priority={true}
                            />
                          );
                        })}
                      </div>
                      <p className="m-0 custom-badge font-size-14">
                        IMB {mediaDetails.vote_average?.toFixed(1) || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="p-2">
                    <p className="font-size-14">
                      Suara:{" "}
                      {formatListPlain(mediaDetails.production_countries)}
                    </p>
                    <div className="d-flex gap-2 flex-wrap mb-3">
                      Actor: {getTopCast(mediaDetails.credits)}
                    </div>
                    <p className="d-flex font-size-14 gap-2">
                      Genre:{" "}
                      {formatGenreListLink(mediaDetails.genres, mediaType)}
                    </p>
                  </div>
                </div>

                <div className="col-md-5 text-white">
                  <div className="p-2">
                    <h4 className="ringkasan">Ringkasan</h4>
                    <div className="ringkasan-details">{getContent()}</div>
                  </div>
                </div>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <FBComments movieId={mediaDetails.id} />

        <Modals
          show={showTrailerModal}
          onHide={handleCloseTrailer}
          movieTitleToDisplay={movieTitleForModal}
        />
      </div>
    </>
  );
};

export default MovieInteraction;
