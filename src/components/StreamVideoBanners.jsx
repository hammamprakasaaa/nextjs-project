"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

const StreamBottomBanner = () => {
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
      { page: "Stream", adsSize: "Horizontal", adsLocation: "Bottom Video" },
    ];

    try {
      const params = new URLSearchParams({
        requests: JSON.stringify(requests),
      });
      const response = await fetch(`/api/movie-ads?${params.toString()}`);

      if (!response.ok) throw new Error("Failed to fetch ads");

      const result = await response.json();
      if (!result.success) throw new Error(result.message || "API failed");

      const bottomAds = result.results
        .filter((r) => r.criteria.adsLocation === "Bottom Video")
        .flatMap((r) => r.data || []);

      return { bottomAds };
    } catch (error) {
      console.error("Ad fetch failed:", error);
      return { bottomAds: [] };
    }
  }

  useEffect(() => {
    const loadAds = async () => {
      const { bottomAds } = await fetchPageAds();
      if (bottomAds.length > 0) {
        const shuffled = shuffleArray(bottomAds);
        setCurrentAd(shuffled[0]);
        handleShow();
      }
    };

    loadAds();
  }, [pathname, handleShow]); 

  if (!show || !currentAd) return null;

  return (
    <div className="stream-popup-banner"
    >
      <button
        onClick={handleClose}
        style={{
          position: "absolute",
          top: "5px",
          right: "5px",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: "24px",
          height: "24px",
          cursor: "pointer",
          fontSize: "14px",
          lineHeight: "24px",
        }}
      >
        ✕
      </button>

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
            borderRadius: "2px",
          }}
        />
      </a>
    </div>
  );
};

export default StreamBottomBanner;
