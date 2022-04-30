const express = require("express");
const db = require("better-sqlite3")("moviezone.db");
const app = express();
const cors = require("cors");
const session = require("express-session");

app.use(cors({ credentials: true, origin: "http://localhost:3001" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "movie-zone-secret-key", resave: false, saveUninitialized: false }));
app.use(express.json());

app.post("/login", (req, res) => {
  if (validCredentials(req.body.username, req.body.password)) {
    req.session.username = req.body.username;
    req.session.password = req.body.password;
    res.status(200).send();
  } else {
    res.status(401).send();
  }
});

app.post("/register", (req, res) => {
  if (userExists(req.body.username)) {
    res.status(400).send();
  } else if (emailExists(req.body.email)) {
    res.status(401).send();
  } else {
    db.prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)").run(req.body.username, req.body.email, req.body.password);
    req.session.username = req.body.username;
    req.session.password = req.body.password;
    res.status(200).send();
  }
});

app.post("/logout", (req, res) => {
  req.session.username = undefined;
  req.session.password = undefined;
  res.status(200).send();
});

app.get("/user", (req, res) => {
  let userInfo = getInformation(req.session.username, req.session.password);

  if (userInfo) {
    res.status(200).send(userInfo);
  } else {
    res.status(401).send();
  }
});

app.post("/list", (req, res) => {
  let list = [];

  if (req.body.category === "cast") {
    const query = db.prepare("SELECT actorid, name, role, picture FROM actors JOIN (SELECT role, actorid AS id FROM acting_roles WHERE movieid = ?) ON actorid = id;");
    for (let actor of query.all(req.body.id)) list.push({ id: actor.actorid, title: actor.name, subtitle: actor.role, type: "actors", picture: actor.picture });
  } else if (req.body.category === "credits") {
    const query = db.prepare("SELECT movieid, title, year, type, poster FROM movies JOIN (SELECT movieid AS id FROM acting_roles WHERE actorid = ?) ON movieid = id ORDER BY year desc;");
    for (let movie of query.all(req.body.id)) list.push({ id: movie.movieid, title: movie.title, subtitle: movie.year, type: movie.type, picture: movie.poster });
  } else {
    if (req.body.category == "new") {
      const query = db.prepare("SELECT movieid, title, year, type, poster FROM movies WHERE (type = ? AND year = ?) LIMIT 20;");
      for (let movie of query.all(req.body.type, new Date().getFullYear())) list.push({ id: movie.movieid, title: movie.title, subtitle: movie.year, type: movie.type, picture: movie.poster });
    } else if (req.body.category == "popular") {
      const query = db.prepare("SELECT movieid, title, year, type, poster FROM movies WHERE type = ? ORDER BY popularity desc LIMIT 20;");
      for (let movie of query.all(req.body.type)) list.push({ id: movie.movieid, title: movie.title, subtitle: movie.year, type: movie.type, picture: movie.poster });
    } else if (req.body.category == "toprated") {
      const query = db.prepare("SELECT movieid, title, year, type, poster FROM movies WHERE (type = ? AND popularity >= 100) ORDER BY rating desc LIMIT 20;");
      for (let movie of query.all(req.body.type)) list.push({ id: movie.movieid, title: movie.title, subtitle: movie.year, type: movie.type, picture: movie.poster });
    }
  }

  res.status(200).send(list);
});

app.post("/search", (req, res) => {
  let results = [];
  const query = db.prepare("SELECT movieid as id, title as name, type, poster as picture, popularity FROM movies WHERE name LIKE '%" + req.body.search + "%' UNION SELECT actorid, name, 'actors', picture, popularity FROM actors WHERE name LIKE '%" + req.body.search + "%' ORDER BY popularity desc LIMIT ?;");

  for (let result of query.all(req.body.maxResult)) {
    let type;

    if (result.type == "movies") type = "Movie";
    if (result.type == "shows") type = "TV Show";
    if (result.type == "actors") type = "Actor";

    results.push({ id: result.id, title: result.name, subtitle: type, type: result.type, picture: result.picture });
  }

  res.status(200).send(results);
});

app.get("/actors/popular", (req, res) => {
  let list = [];

  const query = db.prepare("SELECT actorid, name, birthday, deathday, picture FROM actors ORDER BY popularity desc LIMIT 100;");
  for (let actor of query.all()) list.push({ id: actor.actorid, title: actor.name, subtitle: computeAge(actor.birthday, actor.deathday), type: "actors", picture: actor.picture });

  res.status(200).send(list);
});

app.get("/actors/birthday", (req, res) => {
  let list = [];

  let today = new Date();
  let month = (today.getMonth() + 1).toString().padStart(2, "0");
  let day = today.getDate().toString().padStart(2, "0");

  const query = db.prepare("SELECT actorid, name, birthday, deathday, picture FROM actors WHERE (deathday IS NULL AND birthday LIKE '%/" + month + "/" + day + "') ORDER BY popularity desc LIMIT 200;");
  for (let actor of query.all()) list.push({ id: actor.actorid, title: actor.name, subtitle: computeAge(actor.birthday, actor.deathday), type: "actors", picture: actor.picture });

  res.status(200).send(list);
});

app.get("/:type/popular", (req, res) => {
  let list = [];

  const query = db.prepare("SELECT movieid, title, year, type, poster FROM movies WHERE type = ? ORDER BY popularity desc LIMIT 100;");
  for (let movie of query.all(req.params.type)) list.push({ id: movie.movieid, title: movie.title, subtitle: movie.year, type: movie.type, picture: movie.poster });

  res.status(200).send(list);
});

app.get("/:type/new", (req, res) => {
  let list = [];

  const query = db.prepare("SELECT movieid, title, year, type, poster FROM movies WHERE (type = ? AND year = ?) LIMIT 100;");
  for (let movie of query.all(req.params.type, new Date().getFullYear())) list.push({ id: movie.movieid, title: movie.title, subtitle: movie.year, type: movie.type, picture: movie.poster });

  res.status(200).send(list);
});

app.get("/:type/toprated", (req, res) => {
  let list = [];

  const query = db.prepare("SELECT movieid, title, year, type, poster FROM movies WHERE (type = ? AND popularity >= 50) ORDER BY rating desc LIMIT 100;");
  for (let movie of query.all(req.params.type)) list.push({ id: movie.movieid, title: movie.title, subtitle: movie.year, type: movie.type, picture: movie.poster });

  res.status(200).send(list);
});

app.post("/movies/:id", (req, res) => {
  const query = db.prepare("SELECT * FROM movies WHERE movieid = ?;");
  const result = query.get(req.params.id);

  res.status(200).send({ id: result.movieid, title: result.title, description: result.description, watchlist: inWatchlist(req.session.username, req.session.password, req.params.id), trailer: result.trailer, poster: result.poster, backdrop: result.backdrop, rating: result.rating, duration: result.duration, year: result.year, crew: result.director.split(","), genre: result.genre.replace(/,/g, ", "), budget: result.budget, revenue: result.revenue, watch: result.website });
});

app.post("/shows/:id", (req, res) => {
  const query = db.prepare("SELECT * FROM movies WHERE movieid = ?;");
  const result = query.get(req.params.id);

  res.status(200).send({ id: result.movieid, title: result.title, description: result.description, watchlist: inWatchlist(req.session.username, req.session.password, req.params.id), trailer: result.trailer, poster: result.poster, backdrop: result.backdrop, rating: result.rating, seasons: result.seasons, episodes: result.episodes, year: result.year, status: result.status, crew: result.director.split(","), genre: result.genre.replace(/,/g, ", "), watch: result.website });
});

app.post("/actors/:id", (req, res) => {
  const query = db.prepare("SELECT * FROM actors WHERE actorid = ?;");
  const result = query.get(req.params.id);

  res.status(200).send({ name: result.name, picture: result.picture, biography: result.biography, birthday: result.birthday, age: computeAge(result.birthday, result.deathday), birthplace: result.birthplace, deathday: result?.deathday?.replace(/-/g, "/"), gender: result.gender, credits: result.credits });
});

app.get("/watchlist", (req, res) => {
  if (!validCredentials(req.session.username, req.session.password)) return res.status(401).send();

  let info = {
    username: req.session.username,
    watchlist: [],
  };

  const query = db.prepare("SELECT movieid, title, year, type, poster FROM movies JOIN (SELECT movieid as id FROM watchlist WHERE username = ?) ON movieid = id;");
  for (let movie of query.all(req.session.username)) info.watchlist.push({ id: movie.movieid, title: movie.title, subtitle: movie.year, type: movie.type, picture: movie.poster });

  res.status(200).send(info);
});

app.post("/watchlist/:id", (req, res) => {
  if (!validCredentials(req.session.username, req.session.password)) return res.status(401).send();
  if (inWatchlist(req.session.username, req.session.password, req.params.id)) return res.status(200).send();

  db.prepare("INSERT INTO watchlist (username, movieid) VALUES (?, ?)").run(req.session.username, req.params.id);

  res.status(200).send();
});

app.delete("/watchlist/:id", (req, res) => {
  if (!validCredentials(req.session.username, req.session.password)) return res.status(401).send();
  if (!inWatchlist(req.session.username, req.session.password, req.params.id)) return res.status(200).send();

  db.prepare("DELETE FROM watchlist WHERE (username = ? AND movieid = ?)").run(req.session.username, req.params.id);

  res.status(200).send();
});

app.listen(8888, () => {
  console.log("listening on port 8888");
});

function validCredentials(username, password) {
  const query = db.prepare("SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?");
  return query.get(username, username, password) != undefined;
}

function userExists(username) {
  const query = db.prepare("SELECT * FROM users WHERE username = ?");
  return query.get(username) != undefined;
}

function emailExists(email) {
  const query = db.prepare("SELECT * FROM users WHERE email = ?");
  return query.get(email) != undefined;
}

function getInformation(username, password) {
  if (!validCredentials(username, password)) return false;

  const query = db.prepare("SELECT username, email FROM users WHERE username = ? OR email = ?");
  return query.get(username, username);
}

function inWatchlist(username, password, movieid) {
  if (!validCredentials(username, password)) return false;

  const query = db.prepare("SELECT * FROM watchlist WHERE (username = ? AND movieid = ?);");
  return query.get(username, movieid) != undefined;
}

function computeAge(birth, death) {
  if (death) return "Deceased";
  if (birth == "Unknown" || birth == undefined) return "";

  birth = birth.split("/");
  let birthday = new Date(birth[0], birth[1], birth[2]);
  let difference = Date.now() - birthday.getTime();
  let ageDate = new Date(difference);

  return Math.abs(ageDate.getUTCFullYear() - 1970) + " years old";
}
