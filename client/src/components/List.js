import React from "react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Item from "./Item";

const List = (props) => {
  const [list, setList] = useState([]);

  useEffect(() => {
    let requestInfo;

    if (props.category.type === "cast" || props.category.type === "credits") {
      requestInfo = { category: props.category.type, id: props.category.url };
    } else {
      requestInfo = { category: props.category.url, type: props.category.type };
    }

    fetch(process.env.PUBLIC_URL + "/list", {
      credentials: "include",
      method: "post",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestInfo),
    })
      .then((response) => response.json())
      .then((data) => setList(data));
  }, [props]);

  return (
    <div className="list">
      <div className="list_heading">
        <div>
          <h1 className={props.size === 1 ? "list_title small" : "list_title large"}>{props.category.title}</h1>
        </div>
        {props.viewAllButton && (
          <h4 className="list_url">
            <Link to={"/" + props.category.type + "/" + props.category.url} className="list_title">
              View all
            </Link>
          </h4>
        )}
      </div>

      <div className={props.size === 1 ? "list_small" : "list_medium"}>
        {list.map((item) => {
          return <Item key={item.id} id={item.id} size={props.size} title={item.title} subtitle={item.subtitle} picture={item.picture} type={item.type} />;
        })}
      </div>
    </div>
  );
};

export default List;
