import React from "react";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Item from "../components/Item";

const Movies = (props) => {
  const [list, setList] = useState([]);
  let { category } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);

    fetch("http://localhost:8888/" + props.type + "/" + category, {
      credentials: "include",
      method: "get",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => setList(data));
  }, [props, category]);

  return (
    <div>
      <br />
      <h2 className="result_text">Showing {(category === "toprated" ? "top rated" : category) + " " + props.type}</h2>
      <br />
      <br />
      <div className="result_list">
        {list.map(function (item) {
          return <Item key={item.id} id={item.id} size={1} title={item.title} subtitle={item.subtitle} picture={item.picture} type={item.type} />;
        })}
      </div>
    </div>
  );
};

export default Movies;
