import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Movies from "./pages/Movies";
import Movie from "./pages/Movie";
import Actors from "./pages/Actors";
import Actor from "./pages/Actor";
import Profil from "./pages/Profil";
import Result from "./pages/Result";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />

          <Route path="login" element={<Login />} />
          <Route path="profil" element={<Profil />} />

          <Route path="movies" element={<Movies type={"movies"} />} />
          <Route path="movies/:category" element={<Movies type={"movies"} />} />
          <Route path="movies/id/:id" element={<Movie type={"movies"} />} />

          <Route path="shows" element={<Movies type={"shows"} />} />
          <Route path="shows/:category" element={<Movies type={"shows"} />} />
          <Route path="shows/id/:id" element={<Movie type={"shows"} />} />

          <Route path="actors" element={<Actors />} />
          <Route path="actors/:category" element={<Actors />} />
          <Route path="actors/id/:id" element={<Actor />} />

          <Route path="search/:query" element={<Result />} />

          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
