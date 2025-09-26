import { Suspense } from "react";
import Genre from "@/components/Genre";
import MovieBottomDetails from "@/components/MovieBottomDetails";

export async function generateMetadata() {
  return {
    title: "Telusuri dan Filter Konten",
    description: "Cari Film atau Serial TV berdasarkan preferensi Anda.",
    alternates: {
      canonical: "/genre",
    },
  };
}

export default function GenrePage() {
  return (
    <>
      <Genre />
      <MovieBottomDetails />
    </>
  );
}
