"use client";

import React, { useState, useEffect, useCallback } from "react";
import MovieAdDisplay from "@/components/MovieAdDisplay";

export default function Advertisement() {
  const [topHorizontalAds, setTopHorizontalAds] = useState([]);

  const fetchPageSpecificAds = useCallback(async () => {
    const requests = [
      {
        page: "Advertisement",
        adsSize: "Horizontal",
        adsLocation: "Mobile",
        movieListLocation: null,
      },
    ];

    try {
      const params = new URLSearchParams({
        requests: JSON.stringify(requests),
      });
      const response = await fetch(`/api/movie-ads?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch page ads");
      }

      const fetchedTopAds = result.results
        .filter((r) => r.criteria.adsLocation === "Mobile")
        .flatMap((r) => r.data || []);

      setTopHorizontalAds(fetchedTopAds);
    } catch (err) {
      console.error("Error fetching page-specific ad data:", err);
    }
  }, []);

  useEffect(() => {
    fetchPageSpecificAds();
  }, [fetchPageSpecificAds]);

  return (
    <>
      {topHorizontalAds.length > 0 && (
        <div className="mx-0 mx-sm-5">
          <div className="container-fluid mt-1 mb-1">
            <div className="horizontal-ads">
              {topHorizontalAds.map((ad, index) => (
                <div
                  className="horizontal-item"
                  key={ad.id || `top-ad-${index}`}
                >
                  <MovieAdDisplay
                    adData={ad}
                    imageWidth="641"
                    imageHeight="158"
                    altText={ad.ads_name}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
