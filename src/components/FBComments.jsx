"use client";

import React, { useEffect, useRef, useState } from "react";
import Spinner from "react-bootstrap/Spinner";

const FBComments = ({ movieId }) => {
  const [loading, setLoading] = useState(true);
  const [movieUrl, setMovieUrl] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      const isLocalhost = baseUrl.includes("localhost");
      const url = isLocalhost
        ? baseUrl
        : `${baseUrl}/stream/movie/${movieId}`;
      setMovieUrl(url);
    }
  }, [movieId]);

  useEffect(() => {
    if (window.FB) {
      setLoading(false);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_FB_APP_ID,
          autoLogAppEvents: true,
          xfbml: true,
          version: "v23.0",
        });
        setLoading(false);
      };
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (window.FB && containerRef.current && movieUrl) {
      containerRef.current.innerHTML = `
        <div 
          class="fb-comments" 
          data-href="${movieUrl}" 
          data-width="100%" 
          data-numposts="5" 
          data-colorscheme="dark">
        </div>
      `;
      window.FB.XFBML.parse(containerRef.current);
    }
  }, [movieUrl, loading]);

  return (
    <div className="container-fluid fb-comments-plugin">
      {loading && (
        <div className="d-flex justify-content-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading comments...</span>
          </Spinner>
        </div>
      )}
      <div ref={containerRef}></div>
    </div>
  );
};

export default FBComments;
