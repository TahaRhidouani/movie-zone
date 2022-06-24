import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  let navigate = useNavigate();

  const [login, setLogin] = useState(true);
  const [error, setError] = useState("");

  async function signin() {
    if (document.getElementById("username").value === "" || document.getElementById("password").value === "") {
      setError("Empty field");
    } else {
      fetch("/" + process.env.PUBLIC_URL + "/login", {
        credentials: "include",
        method: "post",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: document.getElementById("username").value, password: document.getElementById("password").value }),
      }).then((response) => {
        if (response.ok) window.location = "/";
        if (response.status === 401) setError("Incorrect credentials");
      });
    }
  }

  async function signup() {
    if (document.getElementById("username").value === "" || document.getElementById("email").value === "" || document.getElementById("password1").value === "" || document.getElementById("password2").value === "") {
      setError("Empty field");
    } else if (document.getElementById("password1").value !== document.getElementById("password2").value) {
      setError("Password don't match");
    } else if (document.getElementById("password1").value.length < 6) {
      setError("Password too short");
    } else {
      fetch("/" + process.env.PUBLIC_URL + "/register", {
        credentials: "include",
        method: "post",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: document.getElementById("username").value, email: document.getElementById("email").value, password: document.getElementById("password1").value }),
      }).then((response) => {
        if (response.ok) window.location = "/";
        if (response.status === 400) setError("Username already exists");
        if (response.status === 401) setError("Email already taken");
      });
    }
  }

  function switchToLogin(bool) {
    setLogin(bool);
    setError("");
  }

  if (login) {
    return (
      <div id="login_wrapper">
        <div id="login_form">
          <h1>Login</h1>
          <div className="login_input_wrapper">
            <label htmlFor="username" className="login_input_label">
              Username
            </label>
            <input type="input" className="login_input_field" placeholder="Username" name="username" id="username" />
          </div>
          <div className="login_input_wrapper">
            <label htmlFor="password" className="login_input_label">
              Password
            </label>
            <input type="password" className="login_input_field" placeholder="Password" name="password" id="password" />
          </div>

          <h3 id="login_error">{error}</h3>

          <button className="login_form_button" onClick={signin}>
            Login
          </button>
          <h3>
            Don't have an account?{" "}
            <span className="switch_login_register" onClick={() => switchToLogin(false)}>
              Sign up
            </span>
          </h3>
        </div>
      </div>
    );
  } else {
    return (
      <div id="login_wrapper">
        <div id="login_form">
          <h1>Sign up</h1>

          <div className="login_input_wrapper">
            <label htmlFor="username" className="login_input_label">
              Username
            </label>
            <input type="input" className="login_input_field" placeholder="Username" name="username" id="username" />
          </div>

          <div className="login_input_wrapper">
            <label htmlFor="email" className="login_input_label">
              Email
            </label>
            <input type="input" className="login_input_field" placeholder="Email" name="email" id="email" />
          </div>

          <br />

          <div className="login_input_wrapper">
            <label htmlFor="password1" className="login_input_label">
              Password
            </label>
            <input type="password" className="login_input_field" placeholder="Password" name="password1" id="password1" />
          </div>

          <div className="login_input_wrapper">
            <label htmlFor="password2" className="login_input_label">
              Password
            </label>
            <input type="password" className="login_input_field" placeholder="Confirm password" name="password2" id="password2" />
          </div>

          <h3 id="login_error">{error}</h3>

          <button className="login_form_button" onClick={signup}>
            Sign up
          </button>

          <h3>
            Already have an account?{" "}
            <span className="switch_login_register" onClick={() => switchToLogin(true)}>
              Sign in
            </span>
          </h3>
        </div>
      </div>
    );
  }
};

export default Login;
