import React from "react";
import Spinner from 'react-bootstrap/Spinner';

const MovieSkeleton = () => {
  return (
    <div className="movie-container movie-size movie-skeleton">
      <div className="skeleton-image">
        <div className="skeleton-loading">
          <Spinner animation="border" variant="primary" role="status">
            <span className="visually-hidden">Memuat konten...</span>
          </Spinner>
        </div>
      </div>
      <div className="movie-title skeleton-text-long"></div>
    </div>
  );
};

export default MovieSkeleton;
