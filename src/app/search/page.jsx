import { Suspense } from "react";
import Search from "@/components/Search";
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

export default function SearchPage() {
  return (
    <>
      <Search />
      <MovieBottomDetails />
    </>
  );
}
