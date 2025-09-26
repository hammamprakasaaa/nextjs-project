"use client";

import React from "react";

export default function StreamBottomDetails({ initialSEOData }) {
  const defaultSEOData = {
    bottom_title: "Nonton Film Online Gratis | Indoxxi, LK21, LayarKaca21",
    bottom_description: `
        <p class="bottom-details-content">
            Situs layanan <a href="https://play8movies.com/" target="_blank" rel="noopener noreferrer">nonton film online gratis</a> menjadi alternatif hemat bagi para penggemar film yang ingin menikmati ribuan judul terbaru, yang kini dapat diakses melalui <strong>Play8Movie</strong>. Platform ini berfungsi sebagai tautan alternatif bagi penikmat tontonan gratis yang sebelumnya mengandalkan <a href="https://play8movies.com/" target="_blank" rel="noopener noreferrer">Indoxxi</a>, <strong>LK21</strong>, dan <a href="https://play8movies.com/" target="_blank" rel="noopener noreferrer">LayarKaca21</a>. <br>
            Meskipun situs seperti Indoxxi atau, <strong>LK21</strong>, dan <a href="https://play8movies.com/" target="_blank" rel="noopener noreferrer">LK21</a> kerap mengalami perubahan alamat domain, minat masyarakat untuk mengaksesnya tetap tinggi. Kini, akses tersebut terintegrasi melalui <strong>Play8Movie.com</strong>, yang memungkinkan pengguna melakukan streaming film tanpa biaya, tanpa perlu pergi ke bioskop, atau berlangganan layanan premium. Beragam genre tersedia, mulai dari film aksi, drama, komedi, hingga serial Korea populer, semuanya mudah diakses dengan kualitas video yang baik. Dengan begitu, siapa saja dapat menikmati pengalaman menonton film berkualitas kapan saja dan di mana saja tanpa batasan.
        </p>
        `,
  };

  const seoData = initialSEOData || defaultSEOData;

  return (
    <div className="footer-image-bg mt-5 py-2 py-sm-5">
      <div className="container">
        <div className="row">
          <div className="col-md-12 py-3">
            {seoData.bottom_title && (
              <h2 className="bottom-details-title">{seoData.bottom_title}</h2>
            )}
            <div
              className="bottom-details-content"
              dangerouslySetInnerHTML={{
                __html: seoData.bottom_description || "",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
