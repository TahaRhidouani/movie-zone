import React from "react";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import List from "../components/List";

const Actor = (props) => {
  const [actor, setActor] = useState({});
  const { id } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);

    fetch(process.env.PUBLIC_URL + "/actors/" + id, {
      credentials: "include",
      method: "post",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setActor(data);
      });
  }, [props, id]);

  return (
    <div>
      <div className="actor_poster">
        <div className="actor_poster_overlay">
          <img src={actor.picture} />
          <div className="actor_poster_text">
            <h1 className="actor_title">{actor.name}</h1>
            <br />
            <h2 className="actor_description">{actor.biography}</h2>
          </div>
        </div>
      </div>

      <div className="actor_bottom_section">
        <List category={{ url: id, title: "Known for", type: "credits" }} size={1} />
        <div className="actor_side_panel">
          <h2 className="actor_description_title">Birthday</h2>
          <h2 className="actor_description">{actor.birthday + " (" + actor.age + ")"}</h2>
          <br />
          <h2 className="actor_description_title">Birthplace</h2>
          <h2 className="actor_description">{actor.birthplace}</h2>
          <br />
          <h2 className="actor_description_title">Death</h2>
          <h2 className="actor_description">{actor.deathday ? actor.deathday : "Still alive"}</h2>
          <br />
          <h2 className="actor_description_title">Gender</h2>
          <h2 className="actor_description">{actor.gender}</h2>
          <br />
          <h2 className="actor_description_title">Known credits</h2>
          <h2 className="actor_description">{actor.credits}</h2>
        </div>
      </div>
      <br />
    </div>
  );
};

export default Actor;
