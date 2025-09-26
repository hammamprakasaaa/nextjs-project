"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFire,
  faPlay,
  faForward,
  faPlayCircle,
  faFilm,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";

import { getYoutubeTrailerUrlClient } from "@/lib/youtubeClient";

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const Modals = ({ show, onHide, movieTitleToDisplay }) => {
  const trailerIframeRef = useRef(null);
  const adVideoRef = useRef(null);

  const [trailerUrls, setTrailerUrls] = useState({});
  const [currentTrailerSrc, setCurrentTrailerSrc] = useState(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);

  const [videoAds, setVideoAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [currentAdData, setCurrentAdData] = useState(null);
  const [currentAdVideoSrc, setCurrentAdVideoSrc] = useState(null);
  const [showAdPlayer, setShowAdPlayer] = useState(false);
  const [showMovieTrailer, setShowMovieTrailer] = useState(false);
  const [isLoadingAds, setIsLoadingAds] = useState(true);

  const [showSkipAdButton, setShowSkipAdButton] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const adTimerId = useRef(null);

  const playMovieTrailerRef = useRef();
  const playNextAdRef = useRef();
  const handleAdEndedRef = useRef();

  const resetAdStates = useCallback(() => {
    setCurrentAdData(null);
    setCurrentAdVideoSrc(null); 
    setCurrentAdIndex(0); 
    setShowAdPlayer(false);
    setShowSkipAdButton(false);
    setAdCountdown(5);
    if (adTimerId.current) {
      clearInterval(adTimerId.current);
      adTimerId.current = null;
    }
  }, []);

  const resetTrailerStates = useCallback(() => {
    setCurrentTrailerSrc(null);
    setIsLoadingTrailer(false);
    setShowMovieTrailer(false);
  }, []);

  const fetchAndCacheTrailer = useCallback(
    async (movieTitle) => {
      if (!movieTitle) {
        console.warn("Modals: No movie title provided for trailer fetch.");
        return null;
      }
      if (trailerUrls[movieTitle]) {
        return trailerUrls[movieTitle];
      }
      setIsLoadingTrailer(true);
      try {
        const url = await getYoutubeTrailerUrlClient(movieTitle);
        if (url) {
          const videoId = url.split("/").pop();
          const finalEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&controls=1`; 
          setTrailerUrls((prevUrls) => ({
            ...prevUrls,
            [movieTitle]: finalEmbedUrl,
          }));
          return finalEmbedUrl;
        }
        return null;
      } catch (error) {
        console.error("Error fetching YouTube trailer:", error);
        return null;
      } finally {
        setIsLoadingTrailer(false);
      }
    },
    [trailerUrls]
  );

  playMovieTrailerRef.current = useCallback(() => {
    resetAdStates();
    setShowMovieTrailer(true);
    setShowAdPlayer(false);

    if (!currentTrailerSrc && movieTitleToDisplay) {
      fetchAndCacheTrailer(movieTitleToDisplay).then((url) => {
        if (url) {
          setCurrentTrailerSrc(url);
        } else {
          console.warn(
            "playMovieTrailer: Could not fetch or set currentTrailerSrc."
          );
        }
      });
    } else if (currentTrailerSrc) {
    } else {
      console.warn(
        "playMovieTrailer: No movieTitleToDisplay to fetch trailer for."
      );
    }
  }, [
    currentTrailerSrc,
    movieTitleToDisplay,
    fetchAndCacheTrailer,
    resetAdStates,
  ]);

  playNextAdRef.current = useCallback(() => {
    if (adTimerId.current) {
      clearInterval(adTimerId.current);
      adTimerId.current = null;
    }
    setAdCountdown(5);
    setShowSkipAdButton(false);

    setCurrentAdIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < videoAds.length) {
        const nextAd = videoAds[nextIndex];
        setCurrentAdData(nextAd);
        setCurrentAdVideoSrc(nextAd.ads_video);
        setShowAdPlayer(true);
        setShowMovieTrailer(false);
      } else {
        playMovieTrailerRef.current();
      }
      return nextIndex;
    });
  }, [videoAds]);

  handleAdEndedRef.current = useCallback(() => {
    if (adVideoRef.current) {
      adVideoRef.current.pause();
    }
    setShowSkipAdButton(false);
    playNextAdRef.current();
  }, []);

  const skipCurrentAd = useCallback(() => {
   
    if (adVideoRef.current) {
      adVideoRef.current.pause();
    }
    if (adTimerId.current) {
      clearInterval(adTimerId.current);
      adTimerId.current = null;
    }
    setShowSkipAdButton(false);
    setAdCountdown(5);
    playNextAdRef.current();
  }, []);

  const handleAdError = useCallback(
    (e) => {
      console.error(
        "Error playing ad video:",
        e.target.error,
        "Current Ad URL:",
        currentAdVideoSrc
      );
     
      playNextAdRef.current();
    },
    [currentAdVideoSrc]
  );

  useEffect(() => {
    const fetchAndPlayContent = async () => {
     
      if (!show) {
        resetAdStates();
        resetTrailerStates();
        setVideoAds([]);
        return;
      }

      setIsLoadingAds(true);

      let fetchedTrailerUrl = null;
      if (movieTitleToDisplay) {
        fetchedTrailerUrl = await fetchAndCacheTrailer(movieTitleToDisplay);
      }

      let adsToPlay = [];

      try {
       
        const response = await fetch(
          "/api/movie-video-ads?ads_location=Trailer"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
     

        if (
          result.success &&
          result.data &&
          Array.isArray(result.data) &&
          result.data.length > 0
        ) {
          adsToPlay = shuffleArray([...result.data]);
          setVideoAds(adsToPlay);
       
        } else {
          console.info("No video ads found.");
          setVideoAds([]);
        }
      } catch (error) {
        console.error("Error fetching video ads:", error);
        setVideoAds([]);
      } finally {
        setIsLoadingAds(false);

        if (adsToPlay.length > 0) {
          setCurrentAdIndex(0);
          const firstAd = adsToPlay[0];
          setCurrentAdData(firstAd);
          setCurrentAdVideoSrc(firstAd.ads_video);
          setShowAdPlayer(true);
          setShowMovieTrailer(false);
        } else if (fetchedTrailerUrl) {
          setCurrentTrailerSrc(fetchedTrailerUrl);
          playMovieTrailerRef.current();
        } else {
          setShowAdPlayer(false);
          setShowMovieTrailer(false);
        }
        setIsLoadingTrailer(false);
      }
    };

    fetchAndPlayContent();

    return () => {
      resetAdStates();
      resetTrailerStates();
      setVideoAds([]);
    };
  }, [
    show,
    movieTitleToDisplay,
    fetchAndCacheTrailer,
    resetAdStates,
    resetTrailerStates,
  ]);

  useEffect(() => {
    if (showAdPlayer && currentAdVideoSrc && adVideoRef.current) {
      adVideoRef.current.load();
      adVideoRef.current.muted = false;

      const playTimeout = setTimeout(() => {
        adVideoRef.current
          .play()
          .then(() => {
            if (adTimerId.current) clearInterval(adTimerId.current);

            setShowSkipAdButton(false);
            setAdCountdown(5);

            adTimerId.current = setInterval(() => {
              setAdCountdown((prev) => {
                if (prev <= 1) {
                  clearInterval(adTimerId.current);
                  adTimerId.current = null;
                  setShowSkipAdButton(true);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          })
          .catch((e) => {
            console.warn("Ad video autoplay failed (browser policy?):", e);
            console.error("Autoplay failed. Skipping ad.", e);
            playNextAdRef.current();
          });
      }, 50);

      return () => {
        if (playTimeout) {
          clearTimeout(playTimeout);
        }
        if (adTimerId.current) clearInterval(adTimerId.current);
        setShowSkipAdButton(false);
        setAdCountdown(5);
      };
    } else if (!showAdPlayer && adVideoRef.current) {
      adVideoRef.current.pause();
    }

    return () => {
      if (adTimerId.current) clearInterval(adTimerId.current);
      setShowSkipAdButton(false);
      setAdCountdown(5);
    };
  }, [showAdPlayer, currentAdVideoSrc]);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton style={{ padding: "5px 15px" }}>
        <Modal.Title>
          {showAdPlayer ? (
            <small>IKLAN</small>
          ) : (
            <small>
              FILM TRAILER
              {movieTitleToDisplay ? ` - ${movieTitleToDisplay}` : ""}
            </small>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: 0 }}>
        <div className="video-wrapper">
          {isLoadingAds || isLoadingTrailer ? (
            <div className="loading-container">
              <Spinner animation="border" variant="primary" role="status">
                <span className="visually-hidden">Konten...</span>
              </Spinner>
              <h5 className="ms-2">Memuat konten...</h5>
            </div>
          ) : (
            <>
              {showAdPlayer && currentAdData && currentAdVideoSrc ? (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "auto",
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
                      onEnded={handleAdEndedRef.current}
                      onError={handleAdError}
                      className="ad-video"
                      playsInline
                      style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: "calc(100vh - 150px)",
                        display: "block",
                      }}
                    />
                  </a>
                  {adCountdown > 0 ? (
                    <Button
                      className="btn-warning btn-sm btn-next"
                      disabled
                    >
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

                  {currentAdData.ads_video_url && (
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
              ) : showMovieTrailer && currentTrailerSrc ? (
                <iframe
                  ref={trailerIframeRef}
                  src={currentTrailerSrc}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{ height: "315px", flexDirection: "column" }}
                >
                  <h4>Iklan dan trailer tidak ada.</h4>
                  {movieTitleToDisplay && (
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                        movieTitleToDisplay
                      )} trailer`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-secondary mt-2"
                    >
                      CARI DI YOUTUBE
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        {showAdPlayer && currentAdData && currentAdData.ads_image && (
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
                alt={currentAdData.ads_name || "Advertisement"}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  borderRadius: "5px",
                  maxHeight: "100px",
                  objectFit: "contain",
                }}
              />
            </a>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default Modals;
