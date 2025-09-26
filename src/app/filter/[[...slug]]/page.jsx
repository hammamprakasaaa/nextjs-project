import { Suspense } from "react";
import { redirect } from "next/navigation";
import FilterClient from "@/components/FilterClient";
import MovieBottomDetails from "@/components/MovieBottomDetails";
import { MENU_DATA_CONFIG } from "@/config/menuConfig";
import { getExternalApi } from "@/lib/api";
import slugify from "slugify";

export async function generateMetadata({ params }) {
  const { slug = [] } = await params;

  const canonicalPath = ["/filter", ...slug].join("/");

  return {
    title: "Telusuri dan Filter Konten",
    description: "Cari Film atau Serial TV berdasarkan preferensi Anda.",
    alternates: {
      canonical: canonicalPath,
    },
  };
}

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

const getGenreIdBySlug = async (mediaType, genreSlug) => {
  const genres = await fetchGenres(mediaType);
  const matched = genres.find(
    (g) => slugify(g.name, { lower: true, strict: true }) === genreSlug
  );
  return matched ? matched.id : null;
};

export default async function FilterPage({ params }) {
  const { slug = [] } = await params;

  function parseFilterParams(slugArray) {
    const filters = {};

    if (slugArray.length > 0) {
      if (slugArray[0] === "film") {
        filters.mediaType = "movie";
      } else if (slugArray[0] === "series") {
        filters.mediaType = "tv";
      } else {
        filters.mediaType = "movie";
        if (slugArray[0] === "year" && slugArray[1]) {
          filters.year = slugArray[1];
          return filters;
        }
      }
    }

    if (
      slugArray.length === 1 &&
      (slugArray[0] === "film" || slugArray[0] === "series")
    ) {
      filters.trending = filters.mediaType;
    }

    for (let i = 1; i < slugArray.length; i += 2) {
      const key = slugArray[i];
      const value = slugArray[i + 1];

      if (key && value) {
        if (key === "category") {
          const mediaTypeConfig =
            MENU_DATA_CONFIG[
              filters.mediaType === "movie" ? "movies" : "tvseries"
            ];
          const matched = mediaTypeConfig?.items.find(
            (item) => item.slug === value
          );

          if (matched) {
            filters.category = matched.category;
            filters.categorySlug = value;
          } else {
            filters.category = value;
          }
        } else if (key === "year") {
          filters.year = value;
        } else if (key === "genre") {
          filters.genreSlug = value; 
        } else {
          filters[key] = value;
        }
      } else if (i === 1) {
        const mediaTypeConfig =
          MENU_DATA_CONFIG[
            filters.mediaType === "movie" ? "movies" : "tvseries"
          ];
        const matchedCategory = mediaTypeConfig?.items.find(
          (item) => item.slug === key
        );
        if (matchedCategory) {
          filters.category = matchedCategory.category;
          filters.categorySlug = key;
          i--;
        }
      }
    }
    return filters;
  }

  const filters = parseFilterParams(slug);

  if (filters.genreSlug) {
    const genreId = await getGenreIdBySlug(filters.mediaType, filters.genreSlug);
    if (genreId) {
      filters.genres = genreId;
      filters.genreName = filters.genreSlug; 
    } else {
      console.warn(`Genre slug "${filters.genreSlug}" not found for ${filters.mediaType}`);
    }
  }

  const filterProps = {
    urlMediaType: filters.mediaType || "movie",
    urlCategory: filters.category || null,
    urlTrending: filters.trending || null,
    urlGenreId: filters.genres || null, 
    urlGenreName: filters.genreName || null, 
    urlYear: filters.year || null,
    urlReleaseDateFrom: filters.releaseDateFrom || null,
    urlReleaseDateTo: filters.releaseDateTo || null,
    urlLanguages: filters.language || null,
    urlKeywords: filters.keywords || null,
  };

  return (
    <>
      <Suspense fallback={<div>Memuat Filter...</div>}>
        <FilterClient {...filterProps} />
      </Suspense>
      <MovieBottomDetails />
    </>
  );
}
