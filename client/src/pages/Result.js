import React from "react";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Item from "../components/Item";

const Result = (props) => {
  let { query } = useParams();
  const [list, setList] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);

    fetch("/search", {
      credentials: "include",
      method: "post",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ search: query, maxResult: -1 }),
    })
      .then((response) => response.json())
      .then((data) => setList(data));
  }, [props, query]);

  return (
    <div>
      <br />
      <h2 className="result_text">
        Found {list.length} results for "{query}"
      </h2>
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

export default Result;
