"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SearchModal from "@/components/SearchModal";
import Bookmarks from "@/components/Bookmarks";
import { MENU_DATA_CONFIG } from "@/config/menuConfig";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Dropdown from "react-bootstrap/Dropdown";
import { usePathname } from "next/navigation";
import slugify from "slugify";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilm,
  faHeart,
  faStar,
  faVideo,
  faTv,
  faCalendar,
  faSearch,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import { getExternalApi } from "@/lib/api";

const fetchMenuItems = async (menuKey, categorySlug = null) => {
  const config = MENU_DATA_CONFIG[menuKey];

  if (!config) {
    console.warn(`No configuration found for menu key: ${menuKey}`);
    return [];
  }

  try {
    let endpoint = config.endpoint;

    if (endpoint && endpoint.includes("/film")) {
      endpoint = endpoint.replace("/film", "/movie");
    }
    if (endpoint && endpoint.includes("/series")) {
      endpoint = endpoint.replace("/series", "/tv");
    }

    if (categorySlug) {
      const matchedItem = config.items.find(
        (item) => item.slug === categorySlug
      );
      if (matchedItem) {
        endpoint = endpoint.replace(":category", matchedItem.category);
      }
    }

    let data;
    if (endpoint) {
      data = await getExternalApi(endpoint, { language: "id-ID" });
    } else if (config.transform) {
      data = {};
    } else {
      return config.items || [];
    }

    return config.transform ? config.transform(data) : config.items || [];
  } catch (error) {
    console.error(`Error fetching ${menuKey}:`, error);
    return [];
  }
};

export default function Header() {
  const [menuData, setMenuData] = useState({});
  const [loadingMenus, setLoadingMenus] = useState({});
  const router = useRouter();

  const pathname = usePathname();

  const isHomePage = pathname === "/";
  const isSearchPage =
    pathname === "/search" ||
    pathname === "/genre" ||
    pathname === "/advertisement";

  // const header = isHomePage && isMobile;

  const [search, setSearch] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const handleSearchButtonClick = (e) => {
    e.preventDefault();
    setShowSearchModal(true);
  };
  const handleLinkClick = () => {};

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?query=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  const getFilterLink = (menuKey, item) => {
    const config = MENU_DATA_CONFIG[menuKey];
    const segments = ["filter"];

    if (config.mediaType) {
      segments.push(config.mediaType);
    }

    if (item.slug) {
      // segments.push("category");
      segments.push(item.slug);
    } else if (item.trendingType) {
      segments.push(item.trendingType);
    } else if (config.queryParam && item.id) {
      if (config.queryParam === "genre") {
        segments.push("genre");
        // segments.push(item.id);
        segments.push(slugify(item.name, { lower: true, strict: true }));
      } else if (config.queryParam === "year") {
        segments.push("year");
        segments.push(item.id);
      }
    }

    return `/${segments.join("/")}`;
  };

  const handleNavDropdownToggle = async (key, isOpen) => {
    if (isOpen && !menuData[key] && !loadingMenus[key]) {
      setLoadingMenus((prev) => ({ ...prev, [key]: true }));
      try {
        const items = await fetchMenuItems(key);
        setMenuData((prev) => ({ ...prev, [key]: items }));
      } catch (e) {
        console.error(`Failed to fetch ${key} menu items:`, e);
        setMenuData((prev) => ({ ...prev, [key]: [] }));
      } finally {
        setLoadingMenus((prev) => ({ ...prev, [key]: false }));
      }
    }
  };

  const renderStaticDropdownItems = (key) => {
    const config = MENU_DATA_CONFIG[key];
    return config.items.map((item) => (
      <Dropdown.Item
        key={item.name}
        as={Link}
        title={item?.name}
        href={getFilterLink(key, item)}
        onClick={handleLinkClick}
      >
        {item.name}
      </Dropdown.Item>
    ));
  };

  const renderDynamicDropdownItems = (key) => {
    if (loadingMenus[key]) {
      return <Dropdown.Item disabled className="text-white">Memuat konten...</Dropdown.Item>;
    }
    if (menuData[key] && menuData[key].length > 0) {
      return menuData[key].map((item) => (
        <Dropdown.Item
          key={item.id}
          as={Link}
          title={item?.name}
          href={getFilterLink(key, item)}
          onClick={handleLinkClick}
        >
          {item.name}
        </Dropdown.Item>
      ));
    }
    return <Dropdown.Item disabled className="text-white">Tidak ada item ditemukan</Dropdown.Item>;
  };

  return (
    <>
      <Navbar
        expand="lg"
        fixed={isHomePage ? "top" : false}
        sticky={isHomePage ? false : "top"}
        className="bg-black-opacity p-0 p-sm-2"
      >
        <Container fluid className="mx-0 mx-sm-5 px-2 px-sm-0">
          {isSearchPage || (
            <Navbar.Toggle
              aria-controls="navbarSupportedContent"
              className="nav-toggle"
            />
          )}
          <Navbar.Brand
            as={Link}
            href="/"
            className={`navbar-brand ${isSearchPage ? "" : "margin-ui"}`}
          >
            <Image
              src="/images/playme-revamp-logo.webp"
              height={50}
              width={153}
              className="img-fluid mobile-logo"
              alt="Playme8 Logo"
              priority
            />
          </Navbar.Brand>
          <div className="d-flex align-items-center justify-content-center gap-2">
            <Form
              className="d-flex d-lg-none search-form "
              role="search"
              onClick={() => router.push("/search")}
            >
              <InputGroup size="sm" className="search-margin vertical-line">
                <Button
                  type="submit"
                  className=" text-white button-grey px-3 py-1"
                  as={Link}
                  href="/search"
                >
                  <FontAwesomeIcon
                    icon={faSearch}
                    style={{ width: "14px", height: "16px" }}
                  />
                </Button>
              </InputGroup>
            </Form>
            {isSearchPage ? (
              <Link href="/" className="x-button"></Link>
            ) : (
              <Bookmarks className="d-lg-none" />
            )}
          </div>
          <Navbar.Collapse id="navbarSupportedContent">
            <Nav className="me-auto mb-2 mb-lg-0 gap-3">
              <NavDropdown title={<>Film</>} id="nav-dropdown-movies">
                {renderStaticDropdownItems("movies")}
              </NavDropdown>

              <NavDropdown title={<>Series</>} id="nav-dropdown-tvseries">
                {renderStaticDropdownItems("tvseries")}
              </NavDropdown>

              <NavDropdown title={<>Trending</>} id="nav-dropdown-trending">
                {renderStaticDropdownItems("trending")}
              </NavDropdown>

              <NavDropdown
                title={<>Genre Film</>}
                id="nav-dropdown-movie-genres"
                onToggle={(isOpen) =>
                  handleNavDropdownToggle("movie_genres", isOpen)
                }
              >
                <div className="mega-wrap">
                  {renderDynamicDropdownItems("movie_genres")}
                </div>
              </NavDropdown>

              <NavDropdown
                title={<>Genre Series</>}
                id="nav-dropdown-tv-genres"
                onToggle={(isOpen) =>
                  handleNavDropdownToggle("tv_genres", isOpen)
                }
              >
                <div className="mega-wrap">
                  {renderDynamicDropdownItems("tv_genres")}
                </div>
              </NavDropdown>

              <NavDropdown
                title={<>Tahun</>}
                id="nav-dropdown-years"
                onToggle={(isOpen) => handleNavDropdownToggle("years", isOpen)}
              >
                <div className="mega-wrap">
                  {renderDynamicDropdownItems("years")}
                </div>
              </NavDropdown>
            </Nav>
            <Form
              className="d-none d-lg-flex search-form"
              role="search"
              onClick={() => router.push("/search")}
            >
              <InputGroup>
                <Link href="/search" className=" text-decoration-none">
                  <Form.Control
                    type="search"
                    placeholder="Cari Film atau Judul"
                    aria-label="Search"
                    // value={search}
                    // onChange={(e) => setSearch(e.target.value)}
                    // onClick={() => setShowSearchModal(true)}
                    className="transparent-input text-white h-100"
                    readOnly
                    style={{ cursor: "pointer" }}
                  />
                </Link>
                <Button
                  variant="dark"
                  type="submit"
                  className="text-white"
                  as={Link}
                  href="/search"
                >
                  <FontAwesomeIcon
                    icon={faSearch}
                    style={{ width: "14px", height: "16px" }}
                  />
                </Button>
              </InputGroup>
            </Form>

            <Bookmarks className="d-none d-lg-block" />
          </Navbar.Collapse>
        </Container>
      </Navbar>
      {/* <SearchModal
        show={showSearchModal}
        onHide={() => setShowSearchModal(false)}
      /> */}
      <div className="bottom-navigation d-flex d-sm-none">
        <Link href="/">
          <img src="/images/navhome.webp" alt="Nav Home" className="nav-home" />
          <p>Home</p>
        </Link>
        <Link href="/genre">
          <img
            src="/images/navgenre.webp"
            alt="Nav Genre"
            className="nav-genre"
          />
          <p>Genre</p>
        </Link>
      </div>
    </>
  );
}
