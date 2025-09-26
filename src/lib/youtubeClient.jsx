export async function getYoutubeTrailerUrlClient(
  movieTitle,
  contextMovieId = ""
) {
  const params = new URLSearchParams({
    query: movieTitle,
    movieId: contextMovieId,
  }).toString();

  const response = await fetch(`/api/youtube-trailer?${params}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(
      `Error calling /api/youtube-trailer: Status ${
        response.status
      }, Message: ${errorData.error || "Unknown error."}`
    );
    return null;
  }

  const data = await response.json();
  return data.youtubeUrl;
}
