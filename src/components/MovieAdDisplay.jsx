"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const MovieAdDisplay = ({ adData, imageWidth, imageHeight, altText }) => {
  if (!adData || !adData.ads_image_url) {
    return null;
  }

  const isMobile = useMediaQuery(768);

  const isExternalLink = adData.ads_url && adData.ads_url.startsWith("http");

  const adContent = (
    <img
      src={adData.ads_image_url}
      alt={altText || adData.ads_name || "Iklan"}
      width={Number(imageWidth)}
      height={Number(imageHeight)}
      style={{
        width: "100%",
        height: "auto",
        objectFit: "cover",
      }}
    />
  );

  if (adData.ads_url) {
    return (
      <a
        href={adData.ads_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={altText}
      >
        {adContent}
      </a>
    );
  
  }

  return adContent;
};

export default MovieAdDisplay;
