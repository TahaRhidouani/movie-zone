import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import List from "../components/List";
import watchlist from "../assets/icons/watchlist.png";
import watchlist_checked from "../assets/icons/watchlist_checked.png";
import play from "../assets/icons/play.png";

const Movie = (props) => {
  const [movie, setMovie] = useState({});
  const [inWatchlist, setInWatchlist] = useState(false);
  const { id } = useParams();
  let navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);

    fetch("http://localhost:1112/" + props.type + "/" + id, {
      credentials: "include",
      method: "post",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {
        setMovie(data);
        setInWatchlist(data.watchlist);
      });
  }, [props, id]);

  function toggleWatchlist() {
    fetch("http://localhost:1112/watchlist/" + id, {
      credentials: "include",
      method: !inWatchlist ? "post" : "delete",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
    }).then((response) => {
      if (response.ok) {
        setInWatchlist(!inWatchlist);
      } else {
        navigate("/login");
      }
    });
  }

  return (
    <div>
      <div className="movie_poster" style={{ backgroundImage: "linear-gradient(to right, rgba(207,96,84, 1) 0%, rgba(207,96,84,1) 20%, rgba(207,96,84,0.6) 80%), url('" + movie.backdrop + "')" }}>
        <div className="movie_poster_overlay">
          <img src={movie.poster} />
          <div className="movie_poster_text">
            <h1 className="movie_title">
              {movie.title}
              <span className="movie_year">{"(" + movie.year + ")"}</span>
            </h1>
            <h2 className="movie_subtitle">{movie.genre}</h2>

            <div className="movie_action_button_wrapper">
              <div className="movie_rating_wrapper" title="Rating">
                <svg viewBox="0 0 36 36">
                  <path className="rating_circle" strokeDasharray={movie.rating + ", 100"} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="7" y="21.5" className="rating_text">
                    {movie.rating + "%"}
                  </text>
                </svg>
              </div>
              <div onClick={toggleWatchlist} className="movie_action_button" title="Add to watchlist">
                <img src={inWatchlist ? watchlist_checked : watchlist} />
              </div>
              <a className="movie_action_button" target="_blank" href={movie.trailer} title="Watch trailer">
                <img src={play} />
              </a>
            </div>
            <h2 className="movie_description_title">Overview</h2>
            <h2 className="movie_description">{movie.description}</h2>
          </div>
        </div>
      </div>

      <div className="movie_bottom_section">
        <List category={{ url: id, title: "Actors", type: "cast" }} size={1} />
        <div className="movie_side_panel">
          {props.type === "movies" && (
            <>
              <h2 className="movie_description_title">Director</h2>
              {movie.crew &&
                movie.crew.map((crew) => (
                  <h2 className="movie_description" key={crew}>
                    {crew}
                  </h2>
                ))}
              <br />
              <h2 className="movie_description_title">Budget</h2>
              <h2 className="movie_description">{movie.budget}</h2>
              <br />
              <h2 className="movie_description_title">Revenue</h2>
              <h2 className="movie_description">{movie.revenue}</h2>
              <br />
              <h2 className="movie_description_title">Duration</h2>
              <h2 className="movie_description">{movie.duration + " minutes"}</h2>
            </>
          )}
          {props.type === "shows" && (
            <>
              <h2 className="movie_description_title">Created by</h2>
              {movie.crew &&
                movie.crew.map((crew) => (
                  <h2 className="movie_description" key={crew}>
                    {crew}
                  </h2>
                ))}
              <br />
              <h2 className="movie_description_title">Seasons</h2>
              <h2 className="movie_description">{movie.seasons}</h2>
              <br />
              <h2 className="movie_description_title">Episodes</h2>
              <h2 className="movie_description">{movie.episodes}</h2>
              <br />
              <h2 className="movie_description_title">Status</h2>
              <h2 className="movie_description">{movie.status}</h2>
            </>
          )}
          <br />
          <br />
          <a href={movie.watch} target="_blank" className="movie_watch_now">
            Watch Now
          </a>
        </div>
      </div>
      <br />
    </div>
  );
};

export default Movie;
