
export const MENU_DATA_CONFIG = {
  
  movies: {
    label: "Film",
    items: [
      { name: "Sedang Tayang", slug: "sedang-tayang", category: "now_playing" },
      { name: "Populer", slug: "populer", category: "popular" },
      { name: "Rating Tertinggi", slug: "rating-tertinggi", category: "top_rated" },
      { name: "Akan Datang", slug: "akan-datang", category: "upcoming" },
    ],
    mediaType: "film",
  },
  tvseries: {
    label: "Series",
    items: [
      { name: "Tayang Hari Ini", slug: "tayang-hari-ini", category: "airing_today" },
      { name: "Sedang Tayang", slug: "sedang-tayang", category: "on_the_air" },
      { name: "Populer", slug: "populer", category: "popular" },
      { name: "Rating Tertinggi", slug: "rating-tertinggi", category: "top_rated" },
    ],
    mediaType: "series",
  },
  trending: {
    label: "Trending",
    items: [
      { name: "Film Trending", trendingType: "film" },
      { name: "TV Trending", trendingType: "series" },
    ],
  },
  movie_genres: {
    label: "Genre Film",
    endpoint: "/genre/movie/list",
    transform: (data) => data.genres.map((g) => ({ id: g.id, name: g.name })),
    queryParam: "genre",
    mediaType: "film",
  },
  tv_genres: {
    label: "Genre Series",
    endpoint: "/genre/tv/list",
    transform: (data) => data.genres.map((g) => ({ id: g.id, name: g.name })),
    queryParam: "genre",
    mediaType: "series",
  },
  years: {
    label: "Tahun",
    transform: () => {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 26 }, (_, i) => ({
        id: currentYear - i,
        name: (currentYear - i).toString(),
      }));
    },
    queryParam: "year",
  },
};
