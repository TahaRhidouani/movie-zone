import React from "react";
import cancelIcon from "../assets/icons/cancel.png";
import searchIcon from "../assets/icons/search.png";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";

export const Search = (props) => {
  const navigate = useNavigate();
  const searchInput = useRef(null);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [searchResult, setSearchResult] = useState([]);

  function search(event) {
    const query = searchInput.current.value;
    if ((event && event.key !== "Enter") || query === undefined || query === "") return;
    clearInput();
    navigate("/search/" + query);
  }

  function fetchAutocomplete() {
    const search = document.activeElement?.value;
    setAutocompleteOpen(search !== "");

    fetch("http://localhost:8888/search", {
      credentials: "include",
      method: "post",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ search: search, maxResult: props.maxResult || 4 }),
    })
      .then((response) => response.json())
      .then((data) => setSearchResult(data));
  }

  function clearInput() {
    searchInput.current.value = "";
    setAutocompleteOpen(false);
    if (props.onCancel) props.onCancel();
  }

  return (
    <div className="searchbar_wrapper">
      <input type="text" ref={searchInput} className={`searchbar ${props.higherVisibility ? "alt" : ""}`} spellCheck="false" placeholder="Movies, TV Shows, Actors & more" onChange={fetchAutocomplete} onKeyDown={search} />
      {props.onCancel !== undefined && <img className="nav_cancel" src={cancelIcon} alt="Cancel" onClick={clearInput} />}
      {props.onCancel === undefined && <img className="nav_cancel" src={searchIcon} alt="Search" onClick={(e) => search(e)} />}
      {autocompleteOpen && searchResult.length > 0 && (
        <div className="search_autocomplete hidden">
          {searchResult.map(function (result) {
            return (
              <Link onClick={clearInput} to={"/" + result.type + "/id/" + result.id} key={result.id} className="search_autocomplete_result">
                {result.title}
                <span className="autocomplete_category">{result.subtitle}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Search;
