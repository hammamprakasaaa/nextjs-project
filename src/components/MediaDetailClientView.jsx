"use client";

import React from "react";
import Script from "next/script";
import Head from "next/head";
import slugify from "slugify";
import MovieInteraction from "@/components/MovieInteraction";
import Trending from "@/components/Trending";
import MovieCarousel from "@/components/MovieCarousel";
import StreamBottomDetails from "@/components/StreamBottomDetails";

function createSlug(title) {
  if (!title) return "";
  let slug = slugify(title, {
    lower: true,
    strict: true,
    locale: "en",
  });
  return slug || title.trim().replace(/\s+/g, "-");
}

export default function MediaDetailClientView({
  mediaDetails,
  streamUrl,
  mediaType,
  initialSeason,
  initialEpisode,
  seasonsData,
  initialTrendingMovies,
  initialTrendingTv,
  initialCarousel,
  initialSEOData,
}) {
  const formatGenres = (genres) => (genres || []).map((genre) => genre.name);
  const formatActors = (cast = []) =>
    cast
      .filter((actor) => actor && actor.name)
      .map((actor) => ({
        "@type": "Person",
        name: actor.name,
        ...(actor.profile_path && {
          image: `https://image.tmdb.org/t/p/w300${actor.profile_path}`,
        }),
        ...(actor.id && {
          sameAs: `https://www.themoviedb.org/person/${actor.id}`,
        }),
      }));

  const getDirector = (credits) => {
    const director = credits?.crew?.find((c) => c.job === "Director");
    return director ? director.name : null; 
  };

  const movieSchema = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: mediaDetails.title,
    url: `https://play8movies.com/stream/${mediaType}/${
      mediaDetails.id
    }/${createSlug(mediaDetails.title || mediaDetails.name)}`,
    image: mediaDetails.poster_path
      ? `https://image.tmdb.org/t/p/w500${mediaDetails.poster_path}`
      : "/images/placeholder.png",
    datePublished: mediaDetails.release_date || mediaDetails.first_air_date,
    genre: formatGenres(mediaDetails.genres),
    contentRating: mediaDetails.rating_age,
    duration: mediaDetails.duration,
    inLanguage: mediaDetails.language,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: mediaDetails.vote_average?.toFixed(1) || "N/A",
      ratingCount: mediaDetails.vote_count,
      bestRating: "10",
      worstRating: "1",
    },
    director: {
      "@type": "Person",
      name: getDirector(mediaDetails.credits),
    },
    actor: formatActors(mediaDetails.credits?.cast || []),
    countryOfOrigin: {
      "@type": "Country",
      name: mediaDetails.country,
    },
    description: mediaDetails?.overview || "Tidak ada sinopsis yang tersedia.",
    trailer: {
      "@type": "VideoObject",
      name: `Official Trailer ${mediaDetails.title || mediaDetails.name}`,
      description:
        mediaDetails?.overview || "Tidak ada sinopsis yang tersedia.",
      thumbnailUrl: mediaDetails.poster_path
        ? `https://image.tmdb.org/t/p/w1280${mediaDetails.poster_path}`
        : "/images/placeholder.png",
      uploadDate: mediaDetails?.release_date
        ? new Date(mediaDetails.release_date).toISOString()
        : null,
      contentUrl: `https://play8movies.com/stream/${mediaType}/${
        mediaDetails.id
      }/${createSlug(mediaDetails.title || mediaDetails.name)}`,
    },
    sameAs: [
      `https://www.imdb.com/title/${mediaDetails.id}`,
      `https://www.themoviedb.org/movie/${mediaDetails.id}`,
    ],
  };

  return (
    <>
      <Script
        id="movie-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(movieSchema) }}
      />
      <MovieInteraction
        mediaDetails={mediaDetails}
        streamUrl={streamUrl}
        mediaType={mediaType}
        initialSeason={initialSeason}
        initialEpisode={initialEpisode}
        seasonsData={seasonsData}
        initialSEOData={initialSEOData}
      />
      <MovieCarousel initialData={initialCarousel} />
      <Trending
        initialData={initialTrendingMovies}
        filterCategory="day"
        mediaType="movie"
        limit={7}
      />
      <Trending
        initialData={initialTrendingTv}
        filterCategory="day"
        mediaType="tv"
        limit={7}
      />
      <StreamBottomDetails initialSEOData={initialSEOData} />
    </>
  );
}
