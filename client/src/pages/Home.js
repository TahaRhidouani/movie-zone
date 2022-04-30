import Search from "../components/Search";
import List from "../components/List";
const mainPoster = require("../assets/pictures/" + Math.floor(Math.random() * (5 - 1 + 1) + 1) + ".png");

function Home() {
  return (
    <>
      <div id="home_poster_wrapper">
        <img src={mainPoster} className="main_poster" alt="Movie background" />
        <div className="main_poster_text_wrapper">
          <h1 className="main_poster_text">Welcome to the Movie Zone</h1>
          <h3 className="main_poster_text">Thousands of movies, TV shows and actors to discover. Explore now.</h3>
          <Search higherVisibility={true} maxResults={4} />
        </div>
      </div>

      <List category={{ url: "new", title: "New Movies", type: "movies" }} size={2} viewAllButton={true} />
      <List category={{ url: "popular", title: "Popular Shows", type: "shows" }} size={1} viewAllButton={true} />
      <List category={{ url: "toprated", title: "Best Rated Movies", type: "movies" }} size={1} viewAllButton={true} />
    </>
  );
}

export default Home;
