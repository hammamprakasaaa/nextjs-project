"use client";

import React, { useState, useCallback, useEffect } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faTrashCan,
  faBookmark,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import slugify from "slugify";

const BOOKMARKS_STORAGE_KEY = "userBookmarks";
const THUMBNAIL_SIZE = "w92";

const Bookmarks = ({ className }) => {
  const [bookmarks, setBookmarks] = useState([]);

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

  const loadBookmarks = useCallback(() => {
    try {
      const storedBookmarks = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (storedBookmarks) {
        setBookmarks(JSON.parse(storedBookmarks));
      } else {
        setBookmarks([]);
      }
    } catch (error) {
      console.error("Failed to load bookmarks from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  useEffect(() => {
    const handleBookmarksUpdate = () => {
      loadBookmarks();
    };

    window.addEventListener("bookmarksUpdated", handleBookmarksUpdate);

    return () => {
      window.removeEventListener("bookmarksUpdated", handleBookmarksUpdate);
    };
  }, [loadBookmarks]);

  const handleRemoveBookmark = useCallback(
    (e, idToRemove) => {
      e.stopPropagation();
      const newBookmarks = bookmarks.filter(
        (bookmark) => bookmark.id !== idToRemove
      );
      setBookmarks(newBookmarks);
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(newBookmarks));
      window.dispatchEvent(new Event("bookmarksUpdated"));
    },
    [bookmarks]
  );

  const handleClearAll = useCallback((e) => {
    e.stopPropagation();
    setBookmarks([]);
    localStorage.removeItem(BOOKMARKS_STORAGE_KEY);
    window.dispatchEvent(new Event("bookmarksUpdated"));
  }, []);

  return (
    <>
      <Dropdown
        align="end"
        autoClose="outside"
        className={`bookmarks-dropdown ${className}`}
      >
        <Dropdown.Toggle
          as={Button}
          id="bookmarks-dropdown"
          className="no-caret"
        >
          <FontAwesomeIcon icon={faBookmark} />
          <span className="d-none d-md-inline">Bookmarks</span>
          <span className="bookmark-count-color badge rounded-pill">
            {" "}
            {bookmarks.length}
          </span>
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <div className="bookmarks-content-wrapper">
            <div className="bookmarks-header">
              <h6>BOOKMARKS</h6>
              {bookmarks.length > 0 && (
                <button className="delete-all-btn" onClick={handleClearAll}>
                  <FontAwesomeIcon icon={faTrashCan} size="xs" /> Delete all
                </button>
              )}
            </div>

            {bookmarks.length > 0 ? (
              <ul className="bookmarks-list">
                {bookmarks.map((movie) => {
                  const movieSlug = createSlug(movie.title);
                  return (
                    <li key={movie.id} className="bookmark-item">
                      <Link
                        href={`/stream/${movie.media_type}/${movie.id}/${movieSlug}`}
                        passHref
                        className="bookmark-movie"
                      >
                        <Image
                          src={movie.posterUrl}
                          alt={movie.title}
                          width={parseInt(THUMBNAIL_SIZE.replace("w", ""))}
                          height={Math.round(
                            parseInt(THUMBNAIL_SIZE.replace("w", "")) * 1.5
                          )}
                          style={{ objectFit: "cover" }}
                          priority={false}
                          className="bookmark-poster"
                        />
                        <p className="bookmark-info">{movie.title}</p>
                      </Link>
                      <button
                        className="remove-bookmark-btn"
                        onClick={(e) => handleRemoveBookmark(e, movie.id)}
                        aria-label={`Remove ${movie.title} from bookmarks`}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="no-bookmarks">Your bookmarks list is empty.</div>
            )}
          </div>
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
};

export default Bookmarks;
