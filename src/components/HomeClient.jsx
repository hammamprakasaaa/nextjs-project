"use client";

import React, { useState, useEffect, useCallback } from "react";
import Script from "next/script";
import slugify from "slugify";
import LazyLoader from "@/components/LazyLoader";
import MovieCarousel from "@/components/MovieCarousel";
import PageHero from "@/components/PageHero";
import ListCategory from "@/components/ListCategory";
import Trending from "@/components/Trending";
import MovieAdDisplay from "@/components/MovieAdDisplay";
import FBComments from "@/components/FBComments";
import MovieBottomDetails from "@/components/MovieBottomDetails";

function buildListItems(data, mediaType = "movie") {
  if (!data?.results) return [];
  return data.results.map((item) => ({
    id: item.id,
    title: item.title || item.name,
    poster: item.poster_path,
    release: item.release_date || item.first_air_date,
    votes: item.vote_count,
    rating: item.vote_average,
    mediaType,
  }));
}
function createSlug(title) {
  if (!title) return "";
  let slug = slugify(title, {
    lower: true,
    strict: true,
    locale: "en",
  });
  return slug || title.trim().replace(/\s+/g, "-");
}

export default function HomeClient({
  initialCarousel,
  initialHero,
  initialTrendingMovies,
  initialTrendingTv,
  initialNowPlaying,
  initialPopularMovies,
  initialTopRatedMovies,
  initialUpcomingMovies,
  initialAiringToday,
  initialOnTheAir,
  initialPopularTv,
  initialTopRatedTv,
  initialTopAds,
  initialBottomAds,
}) {
  const [topHorizontalAds, setTopHorizontalAds] = useState(initialTopAds || []);
  const [bottomHorizontalAds, setBottomHorizontalAds] = useState(
    initialBottomAds || []
  );
  const [loadingAds, setLoadingAds] = useState(true);
  const [errorAds, setErrorAds] = useState(null);

  const combinedData = [
    ...buildListItems(initialTrendingMovies, "movie"),
    ...buildListItems(initialTrendingTv, "tv"),
    ...buildListItems(initialNowPlaying, "movie"),
    ...buildListItems(initialPopularMovies, "movie"),
    ...buildListItems(initialTopRatedMovies, "movie"),
    ...buildListItems(initialUpcomingMovies, "movie"),
    ...buildListItems(initialAiringToday, "tv"),
    ...buildListItems(initialOnTheAir, "tv"),
    ...buildListItems(initialPopularTv, "tv"),
    ...buildListItems(initialTopRatedTv, "tv"),
  ];

  const uniqueCombined = [];
  const seenIds = new Set();

  for (const item of combinedData) {
    if (!seenIds.has(item.id)) {
      uniqueCombined.push(item);
      seenIds.add(item.id);
    }
  }

  const topList = uniqueCombined.slice(0, 10);

  const itemListElement = topList.map((movie, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Movie",
      name: movie.title,
      url: `https://play8movies.com/stream/${movie.mediaType}/${
        movie.id
      }/${createSlug(movie.title || movie.name)}`,
      image: `https://play8movies.com/_next/image?url=https%3A%2F%2Fimage.tmdb.org%2Ft%2Fp%2Fw300%2F${movie.poster}&w=640&q=75`,
      datePublished: movie.release,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: movie.rating?.toFixed(1),
        ratingCount: movie.votes,
      },
    },
  }));

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nonton Film Trending Sub Indo di Play8Movies",
    itemListElement: itemListElement,
  };

  return (
    <>
      <Script
        id="item-list-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <PageHero initialData={initialHero} />
      {topHorizontalAds.length > 0 && (
        <div className="mx-0 mx-sm-5">
          <div className="container-fluid mt-1 mb-1 p-1 p-sm-0">
            <div className="horizontal-ads">
              {topHorizontalAds.map((ad, index) => (
                <div
                  className="horizontal-item"
                  key={ad.id || `top-ad-${index}`}
                >
                  <MovieAdDisplay
                    adData={ad}
                    imageWidth="725.17"
                    imageHeight="159.53"
                    altText={ad.ads_name}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <LazyLoader>
        <MovieCarousel initialData={initialCarousel} />
      </LazyLoader>

      <LazyLoader>
        <Trending
          initialData={initialTrendingMovies}
          filterCategory="day"
          mediaType="movie"
        />
      </LazyLoader>

      <LazyLoader>
        <Trending
          initialData={initialTrendingTv}
          filterCategory="day"
          mediaType="tv"
        />
      </LazyLoader>

      <LazyLoader>
        <ListCategory
          initialData={initialNowPlaying}
          filterCategory="now_playing"
          mediaType="movie"
        />
      </LazyLoader>

      <LazyLoader>
        <ListCategory
          initialData={initialPopularMovies}
          filterCategory="popular"
          mediaType="movie"
        />
      </LazyLoader>

      <LazyLoader>
        <ListCategory
          initialData={initialTopRatedMovies}
          filterCategory="top_rated"
          mediaType="movie"
        />
      </LazyLoader>

      <LazyLoader>
        <ListCategory
          initialData={initialUpcomingMovies}
          filterCategory="upcoming"
          mediaType="movie"
        />
      </LazyLoader>

      <LazyLoader>
        <ListCategory
          initialData={initialAiringToday}
          filterCategory="airing_today"
          mediaType="tv"
        />
      </LazyLoader>
      <LazyLoader>
        <ListCategory
          initialData={initialOnTheAir}
          filterCategory="on_the_air"
          mediaType="tv"
        />
      </LazyLoader>

      <LazyLoader>
        <ListCategory
          initialData={initialPopularTv}
          filterCategory="popular"
          mediaType="tv"
        />
      </LazyLoader>

      <LazyLoader>
        <ListCategory
          initialData={initialTopRatedTv}
          filterCategory="top_rated"
          mediaType="tv"
        />
      </LazyLoader>

      <MovieBottomDetails />
    </>
  );
}
