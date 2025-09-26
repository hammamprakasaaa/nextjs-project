const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_ACCESS_TOKEN = process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL || "https://api.themoviedb.org/3";

// ✅ General API Caller (pakai Bearer Token by default)
export async function callExternalApi(
  path,
  params = {},
  method = "GET",
  bodyData = null,
  revalidate = 60
) {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));

  const options = {
    method,
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
    },
    next: { revalidate },
  };

  if (bodyData && ["POST", "PUT", "PATCH"].includes(method)) {
    options.body = JSON.stringify(bodyData);
    options.headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const errorDetail = await response.json().catch(() => ({}));
      const errorMessage = errorDetail.status_message || `HTTP error! Status: ${response.status}`;
      throw new Error(`API Request Failed: ${errorMessage}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`External API Call Error (${method} ${url.toString()}):`, error);
    throw error;
  }
}

// ✅ Shortcut for GET
export async function getExternalApi(path, params = {}) {
  return callExternalApi(path, params, "GET");
}

// ✅ Alternative fetch (pakai API Key instead of Bearer)
export async function fetchData(endpoint, queryParams = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", TMDB_API_KEY); // 👉 pakai API key, bukan token

  Object.keys(queryParams).forEach((key) => {
    url.searchParams.append(key, queryParams[key]);
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = errorBody.status_message || `HTTP error! Status: ${response.status}`;
    throw new Error(`API Request Failed for ${endpoint}: ${errorMessage}`);
  }

  return await response.json();
}
