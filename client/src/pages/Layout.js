import React from "react";
import { Outlet, Link } from "react-router-dom";
import logo from "../assets/logo.png";
import popularIcon from "../assets/icons/popular.png";
import newReleaseIcon from "../assets/icons/new.png";
import topRatedIcon from "../assets/icons/rating.png";
import tvIcon from "../assets/icons/tv.png";
import birthdayIcon from "../assets/icons/birthday.png";
import searchIcon from "../assets/icons/search.png";
import User from "../components/User";
import Search from "../components/Search";

const Layout = () => {
  function showLink(id) {
    document.getElementById("text_" + id).classList.add("hovering");
    document.getElementById("menu_" + id).classList.remove("hidden");
  }

  function hideLink(id) {
    document.getElementById("text_" + id).classList.remove("hovering");
    document.getElementById("menu_" + id).classList.add("hidden");
  }

  function showSearch() {
    if (document.getElementById("searchbar_wrapper").classList.contains("hidden")) {
      const links = document.getElementsByClassName("nav_links_wrapper");
      for (const link of links) link.classList.add("hidden");
      document.getElementById("searchbar_wrapper").classList.remove("hidden");
    }
  }

  function hideSearch() {
    const links = document.getElementsByClassName("nav_links_wrapper");
    for (const link of links) link.classList.remove("hidden");
    document.getElementById("searchbar_wrapper").classList.add("hidden");
  }

  return (
    <>
      <div id="navbar">
        <Link to="/" id="logo_wrapper">
          <img src={logo} id="logo" alt="Movie Zone" />
        </Link>
        <div id="links_wrapper">
          <div className="nav_links_wrapper" onMouseLeave={() => hideLink(1)}>
            <h3 className="nav_links" onMouseEnter={() => showLink(1)} id="text_1">
              Movies
            </h3>
            <div className="nav_links_menu hidden" id="menu_1">
              <Link to="movies/popular" className="nav_menu_link">
                <img className="nav_menu_link_icon" src={popularIcon} />
                Popular
              </Link>

              <Link to="movies/new" className="nav_menu_link">
                <img className="nav_menu_link_icon" src={newReleaseIcon} />
                New releases
              </Link>

              <Link to="movies/toprated" className="nav_menu_link">
                <img className="nav_menu_link_icon" src={topRatedIcon} />
                Top rated
              </Link>
            </div>
          </div>

          <div className="nav_links_wrapper" onMouseLeave={() => hideLink(2)}>
            <h3 className="nav_links" onMouseEnter={() => showLink(2)} id="text_2">
              TV Shows
            </h3>
            <div className="nav_links_menu hidden" id="menu_2">
              <Link to="shows/popular" className="nav_menu_link">
                <img className="nav_menu_link_icon" src={popularIcon} />
                Popular
              </Link>

              <Link to="shows/new" className="nav_menu_link">
                <img className="nav_menu_link_icon" src={tvIcon} />
                On TV
              </Link>

              <Link to="shows/toprated" className="nav_menu_link">
                <img className="nav_menu_link_icon" src={topRatedIcon} />
                Top rated
              </Link>
            </div>
          </div>

          <div className="nav_links_wrapper" onMouseLeave={() => hideLink(3)}>
            <h3 className="nav_links" onMouseEnter={() => showLink(3)} id="text_3">
              Actors
            </h3>
            <div className="nav_links_menu hidden" id="menu_3">
              <Link to="/actors/popular" className="nav_menu_link">
                <img className="nav_menu_link_icon" src={popularIcon} />
                Popular actors
              </Link>

              <Link to="/actors/birthday" className="nav_menu_link">
                <img className="nav_menu_link_icon" src={birthdayIcon} />
                Birthday today
              </Link>
            </div>
          </div>

          <div id="searchbar_wrapper" className="hidden">
            <Search onCancel={hideSearch} higherVisibility={false} maxResults={4} />
          </div>

          <div>
            <img id="nav_search" src={searchIcon} alt="Search" onClick={showSearch} />
          </div>
        </div>
        <User />
      </div>
      <main>
        <Outlet />
      </main>
      <footer>
        <div>© Copyright 2022 Movie Zone - All Rights Reserved</div>
        <a href="mailto:taharhidouani@gmail.com">Contact us</a>
      </footer>
    </>
  );
};

export default Layout;
