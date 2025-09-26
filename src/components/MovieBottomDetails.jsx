"use client";

import React, { useState, useEffect } from "react";

export default function MovieBottomDetails() {
  const [seoContent, setSeoContent] = useState(null);

  async function getMetaDetails() {
    const defaultHtml = `
      <h1 class="bottom-details-title">Nonton Film Online Gratis | Indoxxi, LK21, LayarKaca21</h1>
      <p class="bottom-details-content">
        Situs layanan <a href="https://play8movies.com/" target="_blank" rel="noopener noreferrer">nonton film online gratis</a> menjadi alternatif hemat bagi para penggemar film yang ingin menikmati ribuan judul terbaru, yang kini dapat diakses melalui <strong>Play8Movie</strong>. Platform ini berfungsi sebagai tautan alternatif bagi penikmat tontonan gratis yang sebelumnya mengandalkan <a href="https://play8movies.com/" target="_blank" rel="noopener noreferrer">Indoxxi</a>, <strong>LK21</strong>, dan <a href="https://play8movies.com/" target="_blank" rel="noopener noreferrer">LayarKaca21</a>. <br>
        Meskipun situs seperti Indoxxi atau, <strong>LK21</strong>, dan <a href="https://play8movies.com/" target="_blank" rel="noopener noreferrer">LK21</a> kerap mengalami perubahan alamat domain, minat masyarakat untuk mengaksesnya tetap tinggi. Kini, akses tersebut terintegrasi melalui <strong>Play8Movie.com</strong>, yang memungkinkan pengguna melakukan streaming film tanpa biaya, tanpa perlu pergi ke bioskop, atau berlangganan layanan premium. Beragam genre tersedia, mulai dari film aksi, drama, komedi, hingga serial Korea populer, semuanya mudah diakses dengan kualitas video yang baik. Dengan begitu, siapa saja dapat menikmati pengalaman menonton film berkualitas kapan saja dan di mana saja tanpa batasan.
      </p>
    `;

    try {
      const seoApiUrl = `/api/seopage?id=1`;

      const seoResponse = await fetch(seoApiUrl, { cache: "no-store" });

      if (seoResponse.ok) {
        const seoData = await seoResponse.json();
        if (seoData.success && seoData.data) {
          return {
            html: `
              <h1 class="bottom-details-title">${seoData.data.title}</h1>
              <p class="bottom-details-content">
                ${seoData.data.description}
              </p>
            `,
          };
        }
      }
    } catch (error) {
      console.error("Error fetching SEO metadata:", error);
    }

    return { html: defaultHtml };
  }

  useEffect(() => {
    getMetaDetails().then((data) => setSeoContent(data));
  }, []);

  return (
    <div className="footer-image-bg mt-5 py-2 py-sm-5">
      <div className="container">
        <div className="row">
          <div
            className="col-md-12 py-3"
            dangerouslySetInnerHTML={{
              __html: seoContent?.html || "",
            }}
          />
        </div>
      </div>
    </div>
  );
}