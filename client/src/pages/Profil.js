import React from "react";
import { useEffect, useState } from "react";
import Item from "../components/Item";
const mainPoster = require("../assets/pictures/" + Math.floor(Math.random() * (5 - 1 + 1) + 1) + ".png");

const Profil = (props) => {
  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    fetch("/" + process.env.PUBLIC_URL + "/watchlist", { credentials: "include", cache: "no-cache" }).then(async (response) => {
      if (response.ok) setUserInfo(await response.json());
    });
  }, [props]);

  return (
    <div>
      <div id="home_poster_wrapper">
        <img src={mainPoster} className="profil_poster" alt="Movie background" />
        <div className="main_poster_text_wrapper">
          <h1 className="profil_poster_text">{"Greetings " + userInfo.username + "!"}</h1>
        </div>
      </div>

      {userInfo.watchlist && (
        <div>
          <br />
          <h2 className="result_text">Your watchlist</h2>
          <br />
          <br />
          <div className="result_list">
            {userInfo.watchlist.map(function (item) {
              return <Item key={item.id} id={item.id} size={1} title={item.title} subtitle={item.subtitle} picture={item.picture} type={item.type} />;
            })}
          </div>
        </div>
      )}

      {(userInfo.watchlist === undefined || userInfo.watchlist.length == 0) && <h1 id="empty_watchlist">Nothing in your watchlist</h1>}
    </div>
  );
};

export default Profil;
