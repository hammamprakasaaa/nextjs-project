import { Suspense } from "react";
import Advertisement from "@/components/Advertisement";
import MovieBottomDetails from "@/components/MovieBottomDetails";

export async function generateMetadata() {
  return {
    title: "Telusuri dan Filter Konten",
    description: "Cari Film atau Serial TV berdasarkan preferensi Anda.",
    alternates: {
      canonical: "/search",
    },
  };
}

export default function AdvertisementPage() {
  return (
    <>
      <Advertisement />
      <MovieBottomDetails />
    </>
  );
}
