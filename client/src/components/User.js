import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const User = (props) => {
  const [userInfo, setUserInfo] = useState(false);

  async function logout() {
    fetch(process.env.PUBLIC_URL + "/logout", {
      credentials: "include",
      method: "post",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
    }).then((response) => {
      if (response.ok) {
        setUserInfo(false);
        window.location = "/";
      }
    });
  }

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/user", { credentials: "include", cache: "no-cache" }).then(async (response) => {
      if (response.ok) setUserInfo(await response.json());
    });
  }, [props]);

  if (userInfo) {
    return (
      <div id="loggedIn">
        <Link to="/profil" id="nav_profil">
          {" "}
          {userInfo.username}{" "}
        </Link>
        <a onClick={logout} href="/">
          Logout
        </a>
      </div>
    );
  } else {
    return (
      <div id="login">
        <Link to="/login">Sign in &emsp; &#10095;</Link>
      </div>
    );
  }
};

export default User;
