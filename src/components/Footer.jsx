"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
// import MovieBottomDetails from "@/components/MovieBottomDetails";
import PopUpBanner from "@/components/PopUpBanner";

const contentByDomain = {
  "play8movies.com": {
    descriptionHtml: ``,
    bottomDescription: "",
    copyright: "©2025 Indoxxi, LK21 – Play8Movie | Nonton Film Gratis Sub Indo",
  },

  default: {
    descriptionHtml: ``,
    bottomDescription: "",
    copyright: "©2025 Indoxxi, LK21 – Play8Movie | Nonton Film Gratis Sub Indo",
  },
};

export default function Footer() {
  const [hostname, setHostname] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentHost = window.location.hostname;
      setHostname(currentHost);
    }
  }, []);

  const content = contentByDomain[hostname] || contentByDomain.default;

  return (
    <>
      {/* <MovieBottomDetails /> */}
      <div className="bg-footer p-5">
        <div className="container">
          <div className="row">
            <div className="col-md-4">
              <div className="footer-details mt-2">
                <Image
                  src="/images/playme-revamp-logo.webp"
                  height={70}
                  width={254}
                  className="img-fluid"
                  alt="Logo"
                  priority
                />
                <div
                  dangerouslySetInnerHTML={{ __html: content.descriptionHtml }}
                />
              </div>
            </div>
            <div className="col-md-4 mb-2">
              <div className="footer-details mt-2">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <h5>FILM</h5>
                    <ul>
                      <li>
                        <Link
                          href="/filter/film"
                          title=" Sedang Tren Film"
                          aria-label=" Sedang Tren Film"
                        >
                          Sedang Tren Film
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/filter/film/sedang-tayang"
                          title="Sedang Tayang"
                          aria-label="Sedang Tayang"
                        >
                          Sedang Tayang
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/filter/film/populer"
                          title="Populer"
                          aria-label="Populer"
                        >
                          Populer
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/filter/film/rating-tertinggi"
                          title="Peringkat Teratas"
                          aria-label="Peringkat Teratas"
                        >
                          Rating Tertinggi
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/filter/film/akan-datang"
                          title="Akan Datang"
                          aria-label="Akan Datang"
                        >
                          Akan Datang
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="col-md-6 mb-2">
                    <h5>TV</h5>
                    <ul>
                      <li>
                        <Link
                          href="/filter/series"
                          title="Sedang Tren TV"
                          aria-label="Sedang Tren TV"
                        >
                          Sedang Tren TV
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/filter/series/tayang-hari-ini"
                          title="Tayang Hari Ini"
                          aria-label="Tayang Hari Ini"
                        >
                          Tayang Hari Ini
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/filter/series/sedang-tayang"
                          title="Sedang Tayang"
                          aria-label="Sedang Tayang"
                        >
                          Sedang Tayang
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/filter/series/populer"
                          title="Populer"
                          aria-label="Populer"
                        >
                          Populer
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/filter/series/peringkat-teratas"
                          title="Peringkat Teratas"
                          aria-label="Peringkat Teratas"
                        >
                          Peringkat Teratas
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="footer-details">
                <div className="row">
                  <div className="col-md-6 mb-5">
                    <h5>TV GENRE</h5>
                    <div className="d-flex align-items-center flex-wrap gap-1 footer-genres">
                      <Link href="/filter/film/genre/aksi" title="Aksi">
                        Aksi
                      </Link>
                      <Link
                        href="/filter/film/genre/petualangan"
                        title="Petualangan"
                      >
                        Petualangan
                      </Link>
                      <Link
                        href="/filter/film/genre/animasi"
                        title="Animasi"
                      >
                        Animasi
                      </Link>
                      <Link
                        href="/filter/film/genre/komedi"
                        title="Komedi"
                      >
                        Komedi
                      </Link>
                      <Link
                        href="/filter/film/genre/kejahatan"
                        title="Kejahatan"
                      >
                        Kejahatan
                      </Link>
                      <Link
                        href="/filter/film/genre/dokumenter"
                        title="Dokumenter"
                      >
                        Dokumenter
                      </Link>
                      <Link href="/filter/film/genre/drama" title="Drama">
                        Drama
                      </Link>
                      <Link
                        href="/filter/film/genre/keluarga"
                        title="Keluarga"
                      >
                        Keluarga
                      </Link>
                      <Link
                        href="/filter/film/genre/fantasi"
                        title="Fantasi"
                      >
                        Fantasi
                      </Link>
                      <Link
                        href="/filter/film/genre/sejarah"
                        title="Sejarah"
                      >
                        Sejarah
                      </Link>
                      <Link
                        href="/filter/film/genre/kengerian"
                        title="Kengerian"
                      >
                        Kengerian
                      </Link>
                      <Link
                        href="/filter/film/genre/musik"
                        title="Musik"
                      >
                        Musik
                      </Link>
                      <Link
                        href="/filter/film/genre/misteri"
                        title="Misteri"
                      >
                        Misteri
                      </Link>
                      <Link
                        href="/filter/film/genre/percintaan"
                        title="Percintaan"
                      >
                        Percintaan
                      </Link>
                      <Link
                        href="/filter/film/genre/cerita-fiksi"
                        title="Cerita Fiksi"
                      >
                        Cerita Fiksi
                      </Link>
                      <Link
                        href="/filter/film/genre/film-tv"
                        title="Film TV"
                      >
                        Film TV
                      </Link>
                      <Link
                        href="/filter/film/genre/cerita-seru"
                        title="Cerita"
                      >
                        Cerita
                      </Link>
                      <Link
                        href="/filter/film/genre/kejahatan"
                        title="Seru"
                      >
                        Seru
                      </Link>
                      <Link
                        href="/filter/film/genre/barat"
                        title="Kejahatan"
                      >
                        Kejahatan
                      </Link>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <h5>Serial TV GENRE</h5>
                    <div className="d-flex align-items-center flex-wrap gap-1 footer-genres">
                      <Link
                        href="/filter/tv/genre/aksi-and-petualangan"
                        title="Aksi & Petualangan"
                      >
                        Aksi &amp; Petualangan
                      </Link>

                      <Link
                        href="/filter/tv/genre/animasi"
                        title="Animasi"
                      >
                        Animasi
                      </Link>
                      <Link href="/filter/tv/genre/komedi" title="Komedi">
                        Komedi{" "}
                      </Link>
                      <Link
                        href="/filter/tv/genre/kejahatan"
                        title="Kejahatan"
                      >
                        Kejahatan{" "}
                      </Link>
                      <Link
                        href="/filter/tv/genre/dokumenter"
                        title="Dokumenter"
                      >
                        Dokumenter
                      </Link>
                      <Link href="/filter/tv/genre/drama" title="Drama">
                        Drama{" "}
                      </Link>
                      <Link
                        href="/filter/tv/genre/keluarga"
                        title="Keluarga"
                      >
                        Keluarga
                      </Link>

                      <Link
                        href="/filter/tv/genre/anak-anak"
                        title="Anak-anak"
                      >
                        Anak-anak{" "}
                      </Link>
                      <Link
                        href="/filter/tv/genre/misteri"
                        title="Misteri"
                      >
                        Misteri
                      </Link>
                      <Link
                        href="/filter/tv/genre/berita"
                        title="Berita"
                      >
                        Berita{" "}
                      </Link>
                      <Link
                        href="/filter/tv/genre/realitas"
                        title="Realitas"
                      >
                        Realitas
                      </Link>
                      <Link
                        href="/filter/tv/genre/sci-fi-and-fantasy"
                        title="Sci-fi & Fantasy"
                      >
                        Sci-fi &amp; Fantasy
                      </Link>
                      <Link href="/filter/tv/genre/sabun" title="Sabun">
                        Sabun{" "}
                      </Link>
                      <Link
                        href="/filter/tv/genre/bicara"
                        title="Bicara"
                      >
                        Bicara{" "}
                      </Link>
                      <Link
                        href="/filter/tv/genre/kejahatan-dan-politik"
                        title="Kejahatan dan Politik"
                      >
                        Kejahatan dan Politik
                      </Link>
                      <Link href="/filter/tv/genre/barat" title="Barat">
                        Barat{" "}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="background-black">
        <div
          className="container"
          dangerouslySetInnerHTML={{ __html: content.bottomDescription }}
        />
        <div className="text-center mt-4">
          <p
            className="text-white"
            dangerouslySetInnerHTML={{ __html: content.copyright }}
          />
        </div>
      </footer>
      <PopUpBanner />
    </>
  );
}
