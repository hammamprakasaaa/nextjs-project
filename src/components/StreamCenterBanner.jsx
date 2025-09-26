"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

const StreamCenterBanner = () => {
  const [show, setShow] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const pathname = usePathname();

  const handleShow = useCallback(() => setShow(true), []);
  const handleClose = () => setShow(false);

  const shuffleArray = (array) => {
    let currentIndex = array.length,
      randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    return array;
  };

  async function fetchPageAds() {
    const requests = [
      { page: "Stream", adsSize: "Square", adsLocation: "Video Centered" },
    ];

    try {
      const params = new URLSearchParams({
        requests: JSON.stringify(requests),
      });
      const response = await fetch(`/api/movie-ads?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch ads");

      const result = await response.json();
      if (!result.success) throw new Error(result.message || "API failed");

      const ads = result.results
        .filter((r) => r.criteria.adsLocation === "Video Centered")
        .flatMap((r) => r.data || []);

      return { ads };
    } catch (error) {
      console.error("Ad fetch failed:", error);
      return { ads: [] };
    }
  }

  useEffect(() => {
    const loadAds = async () => {
      const { ads } = await fetchPageAds();
      if (ads.length > 0) {
        const shuffled = shuffleArray(ads);
        setCurrentAd(shuffled[0]);
        handleShow();
      }
    };
    loadAds();
  }, [pathname, handleShow]);

  if (!show || !currentAd) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#1a1a1a",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
        width: "320px",
        zIndex: 9999,
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          background: "#007bff",
          color: "#fff",
          padding: "8px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "bold",
        }}
      >
        Advertisement
        <button
          onClick={handleClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      <div>
        <a
          href={currentAd.ads_url || "#"}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={currentAd.ads_image_url}
            alt={currentAd.ads_name || "Advertisement"}
            style={{
              display: "block",
              maxWidth: "100%",
              height: "auto",
              margin: "0 auto 8px",
            }}
          />
        </a>
      </div>
    </div>
  );
};

export default StreamCenterBanner;
