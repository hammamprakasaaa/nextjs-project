"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getExternalApi } from "@/lib/api";
import { MENU_DATA_CONFIG } from "@/config/menuConfig";
import slugify from "slugify";

const fetchGenres = async (mediaType) => {
  try {
    const endpoint = `/genre/${mediaType}/list`;
    const data = await getExternalApi(endpoint, { language: "id-ID" });
    return data.genres || [];
  } catch (error) {
    console.error(`Error fetching ${mediaType} genres:`, error);
    return [];
  }
};

const Genre = () => {
  const [movieGenres, setMovieGenres] = useState([]);
  const [tvGenres, setTvGenres] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const [movieList, tvList] = await Promise.all([
        fetchGenres("movie"),
        fetchGenres("tv"),
      ]);
      setMovieGenres(movieList);
      setTvGenres(tvList);
    };
    loadData();
  }, []);

  const getFilterLink = (mediaType, item) => {
    const segments = ["filter", mediaType, "genre", slugify(item.name, { lower: true, strict: true })];
    return `/${segments.join("/")}`;
  };

  return (
    <div className="mx-0 mx-sm-5">
      <div className="container-fluid genre-page mb-3 mb-sm-5">
        <h4>Film Genre</h4>
        <div className="genre-page-list mb-3">
          {movieGenres.map((g) => (
            <Link
              key={g.id}
              href={getFilterLink("film", g)}
              className="btn btn-sm"
            >
              {g.name}
            </Link>
          ))}
        </div>
        <h4>TV Genre</h4>
        <div className="genre-page-list mb-3">
          {tvGenres.map((g) => (
            <Link
              key={g.id}
              href={getFilterLink("tv", g)}
              className="btn btn-sm"
            >
              {g.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Genre;