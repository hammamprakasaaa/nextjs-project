import { NextResponse } from "next/server";
import slugify from "slugify";

export async function middleware(req) {
    const url = req.nextUrl.clone();
    const match = url.pathname.match(/^\/stream\/([^/]+)\/([^/]+)\/([^/]+)/);

    if (!match) {
        return NextResponse.next();
    }

    const [, media, id, title] = match;
     const decodedTitle = decodeURIComponent(title);

     if (containsCJK(decodedTitle)) {
        return NextResponse.next();
    }

    if (isUrlEncoded(title)) {
        const canonicalSlug = slugify(decodedTitle, {
            lower: true,
            strict: true,
            locale: "en",
        });

        url.pathname = `/stream/${media}/${id}/${canonicalSlug}`;
        return NextResponse.redirect(url, 301);
    }
    
    return NextResponse.next();
}

function isUrlEncoded(str) {
    try {
        return str.includes('%') && str !== decodeURIComponent(str);
    } catch (e) {
        return false;
    }
}

function containsCJK(str) {
    return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(str);
}

export const config = {
    matcher: ["/stream/:path*"],
};

