import React from "react";
import { Link } from "react-router-dom";

const Item = (props) => {
  return (
    <Link to={"/" + props.type + "/id/" + props.id} className={"item " + (props.size === 1 ? "small" : "large")}>
      <img src={props.picture} />
      <div className="item_info">
        <h2 className={"item_title " + (props.size === 1 ? "small" : "large")}>{props.title}</h2>
        <h3 className={"item_subtitle " + (props.size === 1 ? "small" : "large")}>{props.subtitle}</h3>
      </div>
    </Link>
  );
};

export default Item;
