import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request) {
    const { searchParams } = new URL(request.url);

    const headersList = await headers();
    const domain = headersList.get('host');

    const batchRequestsJson = searchParams.get('requests');

    let requestsToProcess = [];

    if (batchRequestsJson) {

        requestsToProcess = JSON.parse(batchRequestsJson);
        if (!Array.isArray(requestsToProcess)) {
            throw new Error("Invalid 'requests' parameter: not an array.");
        }
        requestsToProcess = requestsToProcess.map(req => ({ adsLocation: req.adsLocation }));

    } else {
        const adsLocation = searchParams.get('ads_location');
        requestsToProcess.push({ adsLocation });
    }

    const backendBaseUrl = process.env.NEXT_PUBLIC_ADS_URL || "https://nonton.777tech.me";

    const fetchAd = async (criteria, domain) => {
        const params = new URLSearchParams();
        if (criteria.adsLocation) params.append("ads_location", criteria.adsLocation);

        // if (domain) params.append("domain", domain);

        const backendApiUrl = `${backendBaseUrl}/api/movievideoads/filter?${params.toString()}`;

        const response = await fetch(backendApiUrl, {
            cache: 'no-store',
        });

        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            return {
                criteria,
                success: false,
                message: "Invalid response format from backend API.",
                status: 500
            };
        }

        if (data.success === false) {
            return {
                criteria,
                success: true,
                data: null,
                status: 200
            };
        }

        if (!response.ok) {

            return {
                criteria,
                success: false,
                message: data.message || "Failed to fetch data from backend (HTTP error).",
                status: response.status
            };
        }

        if (data.success && data.data) {
            return {
                criteria,
                success: true,
                data: data.data,
                status: 200
            };
        } else {

            return {
                criteria,
                success: true,
                data: null,
                status: 200
            };
        }

    };

    const results = await Promise.all(requestsToProcess.map(req => fetchAd(req, domain)));

    if (!batchRequestsJson && results.length === 1) {
        const { criteria, ...singleResult } = results[0];
        return NextResponse.json(singleResult, { status: singleResult.status });
    }

    return NextResponse.json({ success: true, results: results }, { status: 200 });
}
