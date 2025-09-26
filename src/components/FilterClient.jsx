"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark, faSearch, faAdd } from "@fortawesome/free-solid-svg-icons";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";
import Link from "next/link";
import Container from "react-bootstrap/Container";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import DatePicker from "react-datepicker";
import Select from "react-select";
import Accordion from "react-bootstrap/Accordion";
import { format } from "date-fns";
import MovieAdDisplay from "@/components/MovieAdDisplay";
import slugify from "slugify";

import { getExternalApi } from "@/lib/api";
import { MENU_DATA_CONFIG } from "@/config/menuConfig";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";
const TMDB_IMAGE_BOOKMARK_BASE_URL = "https://image.tmdb.org/t/p/";
const BOOKMARKS_STORAGE_KEY = "userBookmarks";
const POSTER_SIZE = "w342";

const MOBILE_BREAKPOINT = 768;

import Modals from "@/components/Modals";

const getFilterDisplayName = async (key, value) => {
  const config = MENU_DATA_CONFIG[key];
  if (!config) return value;

  if (config.items) {
    const item = config.items.find(
      (item) => item.category === value || item.trendingType === value
    );
    return item ? item.name : value;
  } else if (config.endpoint || config.transform) {
    let fetchedItems = [];
    if (config.endpoint) {
      try {
        const data = await getExternalApi(config.endpoint, {
          language: "id-ID",
        });
        fetchedItems = config.transform ? config.transform(data) : [];
      } catch (error) {
        console.error(`Error fetching display name for ${key}:`, error);
        return value;
      }
    } else if (config.transform) {
      fetchedItems = config.transform({});
    }
    const item = fetchedItems.find((item) => String(item.id) === String(value));
    return item ? item.name : value;
  }
  return value;
};

const fetchAllGenres = async (mediaType) => {
  try {
    const endpoint = `/genre/${mediaType}/list`;
    const data = await getExternalApi(endpoint, {
      language: "id-ID",
    });
    return data.genres || [];
  } catch (error) {
    console.error(`Error fetching ${mediaType} genres:`, error);
    return [];
  }
};

const fetchLanguages = async () => {
  try {
    const data = await getExternalApi("/configuration/languages", {
      language: "id-ID",
    });
    return data
      .map((lang) => ({
        value: lang.iso_639_1,
        label: lang.english_name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error("Error fetching languages:", error);
    return [];
  }
};

const createSlug = (title) => {
  if (!title) return "";

  let slug = slugify(title, {
    lower: true,
    strict: true,
    locale: "en",
  });
  if (!slug) {
    slug = title.trim().replace(/\s+/g, "-");
  }

  return slug;
};

function FilterPageContent({
  urlMediaType,
  urlCategory,
  urlTrending,
  urlGenreId,
  urlGenreName,
  urlYear,
  urlReleaseDateFrom,
  urlReleaseDateTo,
  urlLanguages,
  urlKeywords,
}) {


  const router = useRouter();
  const searchParams = useSearchParams();

  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTitle, setFilterTitle] = useState("Konten yang Difilter");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const [allGenres, setAllGenres] = useState({ movie: [], tv: [] });
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [releaseDateFrom, setReleaseDateFrom] = useState(null);
  const [releaseDateTo, setReleaseDateTo] = useState(null);
  const [keywords, setKeywords] = useState("");
  const [currentMediaType, setCurrentMediaType] = useState("movie");
  const [selectedYear, setSelectedYear] = useState(null);

  const urlGenreIds = searchParams.get("genreIds");

  const [isClient, setIsClient] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedMovieTitle, setSelectedMovieTitle] = useState(null);

  const [activeAccordionKey, setActiveAccordionKey] = useState(null);

  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const [topHorizontalAds, setTopHorizontalAds] = useState([]);
  const [verticalAds, setVerticalAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [errorAds, setErrorAds] = useState(null);

  const [initialContentFetchCompleted, setInitialContentFetchCompleted] =
    useState(false);

  const handleShowModal = (movieTitle) => {
    setSelectedMovieTitle(movieTitle);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMovieTitle(null);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        setActiveAccordionKey(["0", "1"]);
      } else {
        setActiveAccordionKey(null);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  const handleAccordionSelect = useCallback(
    (eventKey) => {
      if (isLargeScreen) {
        setActiveAccordionKey(["0", "1"]);
        return;
      }
      setActiveAccordionKey((prevKeys) => {
        if (prevKeys === null) {
          return [eventKey];
        } else if (prevKeys.includes(eventKey)) {
          return prevKeys.filter((key) => key !== eventKey);
        } else {
          return [...prevKeys, eventKey];
        }
      });
    },
    [isLargeScreen]
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    async function loadInitialFilterData() {
      const movieG = await fetchAllGenres("movie");
      const tvG = await fetchAllGenres("tv");
      setAllGenres({ movie: movieG, tv: tvG });

      const fetchedLangs = await fetchLanguages();
      setLanguages(fetchedLangs);
    }
    loadInitialFilterData();
  }, []);

  useEffect(() => {
    setCurrentMediaType(urlMediaType || "movie");

    if (allGenres[urlMediaType]?.length > 0) {
      if (urlGenreIds) {
        const ids = String(urlGenreIds)
          .split(",")
          .map((id) => id.trim());
        setSelectedGenres(
          allGenres[urlMediaType].filter((g) => ids.includes(String(g.id))) ||
            []
        );
      } else if (urlGenreId) {
        const ids = String(urlGenreId)
          .split(",")
          .map((id) => id.trim());
        setSelectedGenres(
          allGenres[urlMediaType].filter((g) => ids.includes(String(g.id))) ||
            []
        );
      } else {
        setSelectedGenres([]);
      }
    } else {
      setSelectedGenres([]);
    }
    if (urlLanguages && languages?.length > 0) {
      const lang = languages.find((l) => l.value === urlLanguages);
      setSelectedLanguage(lang || null);
    } else {
      setSelectedLanguage(null);
    }
    setReleaseDateFrom(
      urlReleaseDateFrom ? new Date(urlReleaseDateFrom) : null
    );
    setReleaseDateTo(urlReleaseDateTo ? new Date(urlReleaseDateTo) : null);

    const safeKeywords =
      urlKeywords && urlKeywords !== "null" && urlKeywords !== "undefined"
        ? decodeURIComponent(String(urlKeywords))
        : "";
    setKeywords(safeKeywords.trim());

    if (urlYear) {
      const yearInt = parseInt(urlYear, 10);
      setSelectedYear(
        !Number.isNaN(yearInt)
          ? { value: yearInt, label: String(yearInt) }
          : null
      );
    } else {
      setSelectedYear(null);
    }

    if (!initialLoadDone) {
      setPage(1);
      setInitialLoadDone(true);
    }
  }, [
    urlMediaType,
    urlGenreId,
    urlLanguages,
    urlReleaseDateFrom,
    urlReleaseDateTo,
    urlKeywords,
    urlYear,
    allGenres,
    languages,
    initialLoadDone,
  ]);

  const fetchFilteredContent = useCallback(
    async (pageToFetch = 1, append = false) => {
      setLoading(true);
      setError(null);

      let endpoint = "";
      let params = { language: "en-US", page: pageToFetch };
      let titleKey = "";
      let titleValue = "";

      if (keywords.trim()) {
        endpoint = `/search/${currentMediaType}`;
        params.query = keywords.trim();
      } else if (urlGenreId || urlGenreIds || selectedGenres.length > 0) {
        endpoint = `/discover/${currentMediaType}`;
        titleKey = currentMediaType === "movie" ? "movie_genres" : "tv_genres";
        if (selectedGenres.length > 0) {
          params.with_genres = selectedGenres.map((g) => g.id).join(",");
          titleValue = selectedGenres.map((g) => g.name).join(", ");
        } else if (urlGenreIds) {
          params.with_genres = urlGenreIds;
          const ids = urlGenreIds.split(",");
          const genreNames = ids
            .map((id) => {
              const g = (allGenres[currentMediaType] || []).find(
                (genre) => String(genre.id) === id
              );
              return g ? g.name : id;
            })
            .filter(Boolean)
            .join(", ");
          titleValue = genreNames || urlGenreIds;
        } else if (urlGenreId) {
          params.with_genres = urlGenreId;
          const genre = (allGenres[currentMediaType] || []).find(
            (g) => String(g.id) === urlGenreId
          );
          titleValue = genre ? genre.name : urlGenreId;
        }
      } else if (urlCategory) {
        const config =
          urlMediaType === "movie"
            ? MENU_DATA_CONFIG.movies
            : MENU_DATA_CONFIG.tvseries;
        const matched = config.items.find(
          (item) => item.slug === urlCategory || item.category === urlCategory
        );
        const category = matched ? matched.category : urlCategory;

        endpoint = `/${urlMediaType}/${category}`;
        titleKey = urlMediaType === "movie" ? "movies" : "tvseries";
        titleValue = urlCategory;
      } else if (urlTrending) {
        endpoint = `/trending/${urlTrending}/week`;
        titleKey = "trending";
        titleValue =
          urlTrending === "movie"
            ? "Film"
            : urlTrending === "tv"
            ? "Series"
            : urlTrending;
      } else {
        endpoint = `/discover/${currentMediaType}`;
        titleKey = currentMediaType === "movie" ? "movies" : "tvseries";
        titleValue = "discover";
      }

      if (selectedGenres.length > 0) {
        params.with_genres = selectedGenres.map((g) => g.id).join(",");
        titleKey = currentMediaType === "movie" ? "movie_genres" : "tv_genres";
        titleValue = selectedGenres.map((g) => g.name).join(", ");
      } else if (urlGenreIds && urlGenreIds.includes(",")) {
        params.with_genres = urlGenreIds;
        titleKey = currentMediaType === "movie" ? "movie_genres" : "tv_genres";

        const ids = urlGenreIds.split(",");
        const genreNames = ids
          .map((id) => {
            const g = (allGenres[currentMediaType] || []).find(
              (genre) => String(genre.id) === id
            );
            return g ? g.name : id;
          })
          .filter(Boolean)
          .join(", ");

        titleValue = genreNames || urlGenreIds;
      }

      if (selectedLanguage) {
        params.with_original_language = selectedLanguage.value;
      } else if (urlLanguages && !keywords.trim()) {
        params.with_original_language = urlLanguages;
      }

      if (releaseDateFrom) {
        params.primary_release_date_gte = format(releaseDateFrom, "yyyy-MM-dd");
        params.first_air_date_gte = format(releaseDateFrom, "yyyy-MM-dd");
      }
      if (releaseDateTo) {
        params.primary_release_date_lte = format(releaseDateTo, "yyyy-MM-dd");
        params.first_air_date_lte = format(releaseDateTo, "yyyy-MM-dd");
      }

      if (selectedYear) {
        params.primary_release_year = selectedYear.value;
        params.first_air_date_year = selectedYear.value;
        titleKey = "years";
        titleValue = selectedYear.label;
      } else if (
        urlYear &&
        !releaseDateFrom &&
        !releaseDateTo &&
        !keywords.trim()
      ) {
        params.primary_release_year = urlYear;
        params.first_air_date_year = urlYear;
        titleKey = "years";
        titleValue = urlYear;
      }

      if (!endpoint) {
        setLoading(false);
        setError("No valid filter selected. Please choose from the sidebar.");
        setFilterTitle("No Filter Applied");
        return;
      }

      try {
        const fetchPage = async (pageNumber) => {
          const pageParams = { ...params, page: pageNumber };
          return await getExternalApi(endpoint, pageParams);
        };

        const [dataPage1, dataPage2] = await Promise.all([
          fetchPage(pageToFetch),
          pageToFetch === 1 ? fetchPage(pageToFetch + 1) : null,
        ]);

        let combinedResults = [];
        let combinedTotalPages = 0;
        let combinedCurrentPage = dataPage1.page;

        if (dataPage1) {
          combinedResults.push(...dataPage1.results);
          combinedTotalPages = dataPage1.total_pages;
          combinedCurrentPage = dataPage1.page;
        }

        if (dataPage2 && pageToFetch === 1) {
          const existingIds = new Set(combinedResults.map((item) => item.id));
          const uniquePage2Results = dataPage2.results.filter(
            (item) => !existingIds.has(item.id)
          );
          combinedResults.push(...uniquePage2Results);
        }

        const processedContent = combinedResults.map((item) => {
          const mediaTypeForGenres = item.media_type || currentMediaType;
          const itemGenres = allGenres[mediaTypeForGenres] || [];
          const genreNames =
            item.genre_ids
              ?.map((id) => itemGenres.find((g) => g.id === id)?.name)
              .filter(Boolean)
              .join(", ") || "N/A";

          return {
            ...item,
            genreNames: genreNames,
            page: combinedCurrentPage,
          };
        });

        setContent((prevContent) =>
          append ? [...prevContent, ...processedContent] : processedContent
        );
        setTotalPages(combinedTotalPages);
        setPage(combinedCurrentPage);

        if (titleKey && titleValue) {
          let displayString = "";

          if (keywords.trim()) {
            displayString = `Hasil untuk "${keywords.trim()}"`;
          } else if (titleKey === "movie_genres" || titleKey === "tv_genres") {
            displayString = `${MENU_DATA_CONFIG[titleKey]?.label || ""} ${
              selectedGenres.length > 0
                ? selectedGenres.map((g) => g.name).join(", ")
                : await getFilterDisplayName(titleKey, titleValue)
            }`;
          } else if (titleKey === "years" && (urlYear || selectedYear)) {
            displayString = `${MENU_DATA_CONFIG[titleKey]?.label || ""} ${
              selectedYear ? selectedYear.label : urlYear
            }`;
          } else if (titleKey === "movies" || titleKey === "tvseries") {
            const config = MENU_DATA_CONFIG[titleKey];
            const matched = config?.items.find(
              (item) => item.slug === titleValue || item.category === titleValue
            );

            displayString = `${titleKey === "movies" ? "" : "Serial TV &"} ${
              config?.label || ""
            } ${matched ? matched.name : titleValue}`;
          } else {
            displayString = ` ${await getFilterDisplayName(titleKey, titleValue)} ${
              MENU_DATA_CONFIG[titleKey]?.label || ""
            } `;
          }

          if (releaseDateFrom && releaseDateTo) {
            displayString += ` (${format(
              releaseDateFrom,
              "MMM dd, yyyy"
            )} to ${format(releaseDateTo, "MMM dd, yyyy")})`;
          } else if (releaseDateFrom) {
            displayString += ` (Dari ${format(
              releaseDateFrom,
              "MMM dd, yyyy"
            )})`;
          } else if (releaseDateTo) {
            displayString += ` (Ke ${format(releaseDateTo, "MMM dd, yyyy")})`;
          }
          if (selectedLanguage) {
            displayString += ` (Bahasa: ${selectedLanguage.label})`;
          }

          setFilterTitle(displayString || "Konten yang Difilter");
        } else {
          let defaultTitle = "Konten yang Difilter";
          if (keywords.trim()) {
            defaultTitle = `Hasil Pencarian untuk "${keywords.trim()}"`;
          } else if (selectedGenres.length > 0) {
            const genreNames = selectedGenres.map((g) => g.name).join(", ");
            defaultTitle = `${
              currentMediaType === "movie" ? "Film" : "Series"
            } Genre: ${genreNames}`;
          } else if (releaseDateFrom || releaseDateTo) {
            defaultTitle = `${
              currentMediaType === "movie" ? "Film" : "Series"
            } by Release Date`;
          } else if (selectedYear) {
            defaultTitle = `${
              currentMediaType === "movie" ? "Film" : "Series"
            } dari ${selectedYear.label}`;
          } else if (selectedLanguage) {
            defaultTitle = `${
              currentMediaType === "movie" ? "Film" : "Series"
            } by Bahasa (${selectedLanguage.label})`;
          }
          setFilterTitle(defaultTitle);
        }
      } catch (err) {
        console.error("Error fetching filtered content:", err);
        setError("Failed to load content. Please try again.");
        setFilterTitle("Error Loading Content");
      } finally {
        setLoading(false);
      }
    },
    [
      currentMediaType,
      urlMediaType,
      urlCategory,
      urlTrending,
      urlGenreId,
      urlGenreName,
      urlYear,
      selectedGenres,
      selectedLanguage,
      releaseDateFrom,
      releaseDateTo,
      keywords,
      selectedYear,
      allGenres,
    ]
  );

  useEffect(() => {
    if (initialLoadDone || page === 1) {
      fetchFilteredContent(1, false);
    }
  }, [
    urlMediaType,
    urlCategory,
    urlTrending,
    urlGenreId,
    urlYear,
    urlLanguages,
    urlKeywords,
    selectedGenres,
    selectedLanguage,
    releaseDateFrom,
    releaseDateTo,
    keywords,
    selectedYear,
    initialLoadDone,
    fetchFilteredContent,
  ]);

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage((prevPage) => prevPage + 1);
      fetchFilteredContent(page + 1, true);
    }
  };
  const handleApplyFilters = (e) => {
    e.preventDefault();

    const segments = ["/filter"];
    if (currentMediaType) {
      segments.push(currentMediaType === "film" ? "movie" : currentMediaType);
    }

    if (selectedGenres.length === 1) {
      const genre = selectedGenres[0];
      segments.push("genre");
      segments.push(genre.name.toLowerCase().replace(/\s+/g, "-"));
    } else if (selectedGenres.length > 1) {
      const newParams = new URLSearchParams();
      newParams.set("genreIds", selectedGenres.map((g) => g.id).join(","));
      router.push(`${segments.join("/")}/genre?${newParams.toString()}`);
      return;
    }

    if (selectedLanguage) {
      segments.push("language");
      segments.push(selectedLanguage.value);
    }

    if (releaseDateFrom) {
      segments.push("releaseDateFrom");
      segments.push(format(releaseDateFrom, "yyyy-MM-dd"));
    }
    if (releaseDateTo) {
      segments.push("releaseDateTo");
      segments.push(format(releaseDateTo, "yyyy-MM-dd"));
    }

    if (selectedYear) {
      segments.push("year");
      segments.push(selectedYear.value.toString());
    }

    if (keywords.trim()) {
      segments.push("keywords");
      segments.push(encodeURIComponent(keywords.trim()));
    }
    const isOnlyCategoryOrTrending =
      !selectedGenres.length &&
      !selectedLanguage &&
      !releaseDateFrom &&
      !releaseDateTo &&
      !selectedYear &&
      !keywords.trim();

    if (isOnlyCategoryOrTrending) {
      if (urlCategory) {
        segments.push("category");
        segments.push(urlCategory);
      }
      if (urlTrending) {
        segments.push("trending");
        segments.push(urlTrending);
      }
    }

    const finalUrl = segments.join("/");

    router.push(finalUrl);
  };

  const handleClearFilters = () => {
    setReleaseDateFrom(null);
    setReleaseDateTo(null);
    setSelectedGenres([]);
    setSelectedLanguage(null);
    setKeywords("");
    setSelectedYear(null);
    router.push(`/filter/${currentMediaType}`);
  };

  const renderGenreTooltip = useCallback(
    (genreNames, releaseDate) => (props) =>
      (
        <Tooltip id="movie-genre-tooltip" {...props}>
          <div>
            <small className="color-yellow">Genre:</small>{" "}
            <small>{genreNames}</small>
          </div>
          {releaseDate && (
            <>
              <small className="color-yellow">Tanggal Rilis:</small>{" "}
              <small>
                {releaseDate
                  ? new Intl.DateTimeFormat("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }).format(new Date(releaseDate))
                  : ""}
              </small>
            </>
          )}
        </Tooltip>
      ),
    []
  );
  const fetchPageSpecificAds = useCallback(async () => {
    setLoadingAds(true);
    setErrorAds(null);

    const requests = [
      {
        page: "Filter",
        adsSize: "Horizontal",
        adsLocation: "Top",
        movieListLocation: null,
      },
      {
        page: "Filter",
        adsSize: "Vertical",
        adsLocation: "Top",
        movieListLocation: null,
      },
    ];

    try {
      const nextJsApiUrl = `/api/movie-ads`;
      const params = new URLSearchParams({
        requests: JSON.stringify(requests),
      });

      const fullApiUrl = `${nextJsApiUrl}?${params.toString()}`;

      const response = await fetch(fullApiUrl);
      const result = await response.json();

      if (!response.ok || !result.success || !Array.isArray(result.results)) {
        console.error(
          "Page-specific ad fetch: API returned error or invalid format.",
          result.message || "Unknown error."
        );
        setErrorAds("Failed to load some ads.");
        return;
      }

      const fetchedTopAds = result.results
        .filter(
          (r) =>
            r.criteria.adsLocation === "Top" &&
            r.criteria.adsSize === "Horizontal"
        )
        .flatMap((r) => r.data || []);

      const fetchedVerticaclAds = result.results
        .filter(
          (r) =>
            r.criteria.adsLocation === "Top" &&
            r.criteria.adsSize === "Vertical"
        )
        .flatMap((r) => r.data || []);

      setTopHorizontalAds(fetchedTopAds);
      setVerticalAds(fetchedVerticaclAds);
    } catch (err) {
      console.error("Error fetching page-specific ad data:", err);
      setErrorAds("Failed to load page ads. Please try again.");
    } finally {
      setLoadingAds(false);
    }
  }, []);

  useEffect(() => {
    fetchPageSpecificAds();
  }, [fetchPageSpecificAds]);

  const handleFavoriteClick = useCallback((e, movie) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const storedBookmarks = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      const bookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : [];

      const isAlreadyBookmarked = bookmarks.some(
        (bookmark) => bookmark.id === movie.id
      );

      if (!isAlreadyBookmarked) {
        const bookmarkData = {
          id: movie.id,
          title: movie.title || movie.name,
          media_type: movie.media_type,
          year: (movie.release_date || "").substring(0, 4),
          posterUrl: `${TMDB_IMAGE_BOOKMARK_BASE_URL}w200${movie.poster_path}`,
        };
        const newBookmarks = [...bookmarks, bookmarkData];
        localStorage.setItem(
          BOOKMARKS_STORAGE_KEY,
          JSON.stringify(newBookmarks)
        );

        window.dispatchEvent(new Event("bookmarksUpdated"));
      } else {
      }
    } catch (error) {
      console.error("Failed to add to bookmarks:", error);
    }
  }, []);

  return (
    <div className="mx-2 mx-sm-5 mb-5">
      <Container fluid className="p-0">
        {topHorizontalAds.length > 0 && (
          <div className="horizontal-ads-filter mb-4">
            {!loadingAds &&
              topHorizontalAds.map((ad, index) => (
                <div
                  className="horizontal-item-filter"
                  key={ad.id || `top-ad-${index}`}
                >
                  <MovieAdDisplay
                    adData={ad}
                    imageWidth="478.16"
                    imageHeight="118.03"
                    altText={ad.ads_name || "Iklan"}
                  />
                </div>
              ))}
          </div>
        )}
        <Container className="p-0">
          <Row>
            <Col md={3} className="mb-4 width-30">
              <Accordion
                activeKey={activeAccordionKey}
                onSelect={handleAccordionSelect}
                className="accordion-filter"
              >
                <Accordion.Item eventKey="0">
                  <Accordion.Header>
                    <h4 className="m-0">Filter</h4>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Form
                      onSubmit={handleApplyFilters}
                      className="mb-4 filter-form"
                    >
                      <Form.Group className="mb-3">
                        <Form.Label>Jenis Konten</Form.Label>
                        <Form.Select
                          value={currentMediaType}
                          onChange={(e) => setCurrentMediaType(e.target.value)}
                        >
                          <option value="movie">Film</option>
                          <option value="tv">Serial TV</option>
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Tanggal Rilis Dari</Form.Label>
                        <DatePicker
                          selected={releaseDateFrom}
                          onChange={(date) => setReleaseDateFrom(date)}
                          selectsStart
                          startDate={releaseDateFrom}
                          endDate={releaseDateTo}
                          dateFormat="yyyy/MM/dd"
                          className="form-control"
                          placeholderText="Select start date"
                          isClearable
                        />
                      </Form.Group>
                      <Form.Group className="mb-3 w-100">
                        <Form.Label>Hingga Tanggal</Form.Label>
                        <DatePicker
                          selected={releaseDateTo}
                          onChange={(date) => setReleaseDateTo(date)}
                          selectsEnd
                          startDate={releaseDateFrom}
                          endDate={releaseDateTo}
                          minDate={releaseDateFrom}
                          dateFormat="yyyy/MM/dd"
                          className="form-control"
                          placeholderText="Select end date"
                          isClearable
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Tahun</Form.Label>
                        {isClient ? (
                          <Select
                            options={MENU_DATA_CONFIG.years
                              .transform()
                              .map((y) => ({ value: y.id, label: y.name }))}
                            value={selectedYear}
                            onChange={setSelectedYear}
                            isClearable
                            placeholder="Select Year"
                            classNamePrefix="react-select"
                          />
                        ) : (
                          <Form.Control
                            type="text"
                            placeholder="Loading years..."
                            disabled
                          />
                        )}
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Genre</Form.Label>
                        <div
                          className="genre-list-container p-2 rounded"
                          style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                          {allGenres[currentMediaType]?.map((genre) => (
                            <Form.Check
                              key={genre.id}
                              type="checkbox"
                              id={`genre-${genre.id}`}
                              label={genre.name}
                              checked={selectedGenres.some(
                                (g) => g.id === genre.id
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGenres((prev) => [...prev, genre]);
                                } else {
                                  setSelectedGenres((prev) =>
                                    prev.filter((g) => g.id !== genre.id)
                                  );
                                }
                              }}
                            />
                          ))}
                          {allGenres[currentMediaType]?.length === 0 && (
                            <p className="text-muted">Memuat genre...</p>
                          )}
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Bahasa</Form.Label>
                        {isClient ? (
                          <Select
                            options={languages}
                            value={selectedLanguage}
                            onChange={setSelectedLanguage}
                            isClearable
                            placeholder="Select Language"
                            classNamePrefix="react-select"
                          />
                        ) : (
                          <Form.Control
                            type="text"
                            placeholder="Loading languages..."
                            disabled
                          />
                        )}
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Kata kunci</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., action, superhero"
                          value={keywords}
                          onChange={(e) => setKeywords(e.target.value)}
                          className="filter-search"
                        />
                      </Form.Group>

                      <div className="d-grid gap-2">
                        <Button className="btn-colorful" type="submit">
                          Terapkan Filter
                        </Button>
                        <Button
                          className="btn theme-black-btn-filter"
                          onClick={handleClearFilters}
                        >
                          Hapus Filter
                        </Button>
                      </div>
                    </Form>
                    {!loadingAds && verticalAds && (
                      <div className="vertical-ads">
                        {!loadingAds &&
                          verticalAds.length > 0 &&
                          verticalAds.map((ad, index) => (
                            <div
                              className="vertical-item"
                              key={ad.id || `top-ad-${index}`}
                            >
                              <MovieAdDisplay
                                adData={ad}
                                imageWidth="270"
                                imageHeight="540"
                                altText={ad.ads_name || "Iklan"}
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Col>

            <Col md={9} className="width-70">
              <h1 className="mb-4 text-white h3">{filterTitle}</h1>

              {loading && content.length === 0 && (
                <div className="text-center">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Memuat konten...</span>
                  </Spinner>
                  <p>Memuat konten...</p>
                </div>
              )}

              {error && <Alert variant="danger">{error}</Alert>}

              {!loading && !error && content.length === 0 && (
                <Alert variant="info">
                  Tidak ada konten yang ditemukan untuk filter ini.
                </Alert>
              )}
              {!error && content.length > 0 && (
                <div className="movie-list">
                  {content.map((item) => {
                    const movieTitle = item.title || item.name;
                    const movieSlug = createSlug(movieTitle);

                    return (
                      <div
                        key={`${item.id}-${item.page}`}
                        className="movie-container movie-filter-size"
                        tabIndex="0"
                      >
                        <div className="add-bookmark-btn">
                          <button
                            className="btn btn-secondary btn-custom-gray rounded-pill"
                            onClick={(e) => handleFavoriteClick(e, item)}
                            aria-label="Add to bookmarks"
                          >
                            <FontAwesomeIcon icon={faBookmark} />
                          </button>
                        </div>
                        <Link
                          href={`/stream/${currentMediaType}/${item.id}/${movieSlug}`}
                          title={movieTitle}
                          style={{ textDecoration: "none" }}
                        >
                          <Image
                            src={
                              item.poster_path
                                ? `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE}${item.poster_path}`
                                : "/images/placeholder.png"
                            }
                            alt={item.title || item.name || "Movie poster"}
                            className="slide-image-list-filter"
                            width={150}
                            height={225}
                          />
                        </Link>

                        <div className="movie-title">
                          <Link
                            href={`/stream/${currentMediaType}/${item.id}/${movieSlug}`}
                            title={movieTitle}
                            style={{ textDecoration: "none" }}
                          >
                            <span>{item.title || item.name}</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && content.length > 0 && page < totalPages && (
                <div className="text-center mt-5">
                  <Button
                    onClick={handleLoadMore}
                    className="btn-colorful filter-button-color"
                  >
                    Muat Lagi
                    {loading && (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="ms-2"
                      />
                    )}
                  </Button>
                </div>
              )}

              {loading && content.length > 0 && (
                <div className="text-center mt-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Tampilkan Lagi</span>
                  </Spinner>
                </div>
              )}
            </Col>
          </Row>
        </Container>
        <Modals
          show={showModal}
          onHide={handleCloseModal}
          movieTitleToDisplay={selectedMovieTitle}
        />
      </Container>
    </div>
  );
}

export default function FilterClient(props) {
  return (
    <Suspense fallback={<div>Memuat Filter...</div>}>
      <FilterPageContent {...props} />
    </Suspense>
  );
}
