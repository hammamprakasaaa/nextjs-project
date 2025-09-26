"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import { Navigation, Pagination, Autoplay, FreeMode } from "swiper/modules";

const StreamAdsSlider = () => {
  const [ads, setAds] = useState([]);

  async function fetchPageAds() {
    const requests = [
      { page: "Stream", adsSize: "Horizontal", adsLocation: "Slider" },
    ];

    try {
      const params = new URLSearchParams({
        requests: JSON.stringify(requests),
      });
      const response = await fetch(`/api/movie-ads?${params.toString()}`);

      if (!response.ok) throw new Error("Failed to fetch ads");

      const result = await response.json();
      if (!result.success) throw new Error(result.message || "API failed");

      const topAds = result.results
        .filter((r) => r.criteria.adsLocation === "Slider")
        .flatMap((r) => r.data || []);

      return topAds;
    } catch (error) {
      console.error("Ad fetch failed:", error);
      return [];
    }
  }

  useEffect(() => {
    async function getAds() {
      const fetchedAds = await fetchPageAds();
      setAds(fetchedAds);
    }
    getAds();
  }, []);

  return (
    <>
      <div className="mt-2 mx-1 mx-sm-0">
        <div className="container-fluid p-0 stream-ad-swiper">
          <Swiper
            modules={[Navigation, Pagination, Autoplay, FreeMode]}
            className="mySwiper movie-carousel-container swiper-stream-ads stream-ad-list pb-3"
            loop={true}
            autoplay={{
              delay: 5500,
              disableOnInteraction: false,
            }}
            pagination={{ clickable: true }}
            spaceBetween={0}
            freeMode={true}
            slidesPerView={"auto"}
          >
            {ads.length > 0 ? (
              ads.map((ad, index) => (
                <SwiperSlide key={index}>
                  <Link
                    href={ad.ads_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={ad.ads_image_url}
                      alt={ad.ads_name || `Ad ${index + 1}`}
                      className="img-fluid"
                      width={260}
                      height={96}
                    />
                  </Link>
                </SwiperSlide>
              ))
            ) : (
              <></>
            )}
          </Swiper>
        </div>
      </div>
    </>
  );
};

export default StreamAdsSlider;
