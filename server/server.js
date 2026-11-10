const express = require("express");
const db = require("better-sqlite3")(process.env.DB_PATH || "moviezone.db");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const app = express();
const cors = require("cors");
const session = require("express-session");

const PORT = process.env.PORT || 8080;
const YEAR = 2022; // new Date().getFullYear();
const BCRYPT_HASH = /^\$2[aby]\$/;

// Hash any password still stored in plain text before the first login is checked
const passwordsMigrated = migratePasswords();

app.set("trust proxy", true);

// Client routes and API routes can share a URL and differ only by Accept, so caches must key on it
app.use((req, res, next) => {
  res.vary("Accept");
  next();
});

// TMDB images are stored at their original size; send the size each one is shown at
const IMAGE_SIZES = { picture: "w342", poster: "w342", backdrop: "w1280" };
app.set("json replacer", (key, value) => (IMAGE_SIZES[key] && typeof value === "string" ? value.replace("/t/p/original/", "/t/p/" + IMAGE_SIZES[key] + "/") : value));

app.get("/healthz", (req, res) => res.status(200).send("ok"));

app.use(express.static(path.resolve(__dirname, "../client/build")));

// Browser navigation to a client route gets the React app. Some client routes share a GET path
// with the API (for example /movies/popular), but the client's fetch() calls send Accept: */*.
app.get("*", (req, res, next) => {
  if (path.extname(req.path) || req.accepts(["json", "html"]) !== "html") return next();
  res.sendFile(path.resolve(__dirname, "../client/build/index.html"));
});

app.use(cors({ credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"), resave: false, saveUninitialized: false, cookie: { secure: "auto", sameSite: "lax" } }));
app.use(express.json());

// The session holds the username only: load that user, or clear a session whose user no longer exists
app.use((req, res, next) => {
  if (req.session.username) {
    req.user = db.prepare("SELECT username, email FROM users WHERE username = ?").get(req.session.username);
    if (!req.user) req.session.username = undefined;
  }
  next();
});

// Errors in these async handlers go to Express (a 500) instead of crashing the process, for example before the data is restored
app.post("/login", async (req, res, next) => {
  if (!validCredentialInput(req.body.username, req.body.password)) return res.status(401).send();
  await passwordsMigrated;

  try {
    const user = await findUser(req.body.username, req.body.password);
    if (user) {
      signIn(req, user.username, (err) => (err ? next(err) : res.status(200).send()));
    } else {
      res.status(401).send();
    }
  } catch (error) {
    next(error);
  }
});

app.post("/register", async (req, res, next) => {
  if (!validCredentialInput(req.body.username, req.body.password) || typeof req.body.email !== "string") return res.status(400).send();
  await passwordsMigrated;

  try {
    // Hash first so the checks and the insert below run without a gap
    const password = await bcrypt.hash(req.body.password, 10);

    if (userExists(req.body.username)) {
      res.status(400).send();
    } else if (emailExists(req.body.email)) {
      res.status(401).send();
    } else {
      db.prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)").run(req.body.username, req.body.email, password);
      signIn(req, req.body.username, (err) => (err ? next(err) : res.status(200).send()));
    }
  } catch (error) {
    next(error);
  }
});

app.post("/logout", (req, res, next) => {
  // End the session and drop its cookie, so the old session ID no longer works
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    res.status(200).send();
  });
});

app.get("/user", (req, res) => {
  if (req.user) {
    res.status(200).send(req.user);
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
      for (let movie of query.all(req.body.type, YEAR)) list.push({ id: movie.movieid, title: movie.title, subtitle: movie.year, type: movie.type, picture: movie.poster });
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
  if (typeof req.body.search !== "string" || !Number.isInteger(req.body.maxResult)) return res.status(400).send();

  let results = [];
  const term = "%" + req.body.search + "%";
  const query = db.prepare("SELECT movieid as id, title as name, type, poster as picture, popularity FROM movies WHERE name LIKE ? UNION SELECT actorid, name, 'actors', picture, popularity FROM actors WHERE name LIKE ? ORDER BY popularity desc LIMIT ?;");

  for (let result of query.all(term, term, req.body.maxResult)) {
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
  for (let movie of query.all(req.params.type, YEAR)) list.push({ id: movie.movieid, title: movie.title, subtitle: movie.year, type: movie.type, picture: movie.poster });

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
  if (!result) return res.status(404).send();

  res.status(200).send({ id: result.movieid, title: result.title, description: result.description, watchlist: inWatchlist(req.user, req.params.id), trailer: result.trailer, poster: result.poster, backdrop: result.backdrop, rating: result.rating, duration: result.duration, year: result.year, crew: result.director.split(","), genre: result.genre.replace(/,/g, ", "), budget: result.budget, revenue: result.revenue, watch: result.website });
});

app.post("/shows/:id", (req, res) => {
  const query = db.prepare("SELECT * FROM movies WHERE movieid = ?;");
  const result = query.get(req.params.id);
  if (!result) return res.status(404).send();

  res.status(200).send({ id: result.movieid, title: result.title, description: result.description, watchlist: inWatchlist(req.user, req.params.id), trailer: result.trailer, poster: result.poster, backdrop: result.backdrop, rating: result.rating, seasons: result.seasons, episodes: result.episodes, year: result.year, status: result.status, crew: result.director.split(","), genre: result.genre.replace(/,/g, ", "), watch: result.website });
});

app.post("/actors/:id", (req, res) => {
  const query = db.prepare("SELECT * FROM actors WHERE actorid = ?;");
  const result = query.get(req.params.id);
  if (!result) return res.status(404).send();

  res.status(200).send({ name: result.name, picture: result.picture, biography: result.biography, birthday: result.birthday, age: computeAge(result.birthday, result.deathday), birthplace: result.birthplace, deathday: result?.deathday?.replace(/-/g, "/"), gender: result.gender, credits: result.credits });
});

app.get("/watchlist", (req, res) => {
  if (!req.user) return res.status(401).send();

  let info = {
    username: req.user.username,
    watchlist: [],
  };

  const query = db.prepare("SELECT movieid, title, year, type, poster FROM movies JOIN (SELECT movieid as id FROM watchlist WHERE username = ?) ON movieid = id;");
  for (let movie of query.all(req.user.username)) info.watchlist.push({ id: movie.movieid, title: movie.title, subtitle: movie.year, type: movie.type, picture: movie.poster });

  res.status(200).send(info);
});

app.post("/watchlist/:id", (req, res) => {
  if (!req.user) return res.status(401).send();
  if (inWatchlist(req.user, req.params.id)) return res.status(200).send();

  db.prepare("INSERT INTO watchlist (username, movieid) VALUES (?, ?)").run(req.user.username, req.params.id);

  res.status(200).send();
});

app.delete("/watchlist/:id", (req, res) => {
  if (!req.user) return res.status(401).send();
  if (!inWatchlist(req.user, req.params.id)) return res.status(200).send();

  db.prepare("DELETE FROM watchlist WHERE (username = ? AND movieid = ?)").run(req.user.username, req.params.id);

  res.status(200).send();
});

app.listen(PORT, () => {
  console.log("listening on port " + PORT);
});

// Give the signed-in user a new session ID (against session fixation) that holds only the username
function signIn(req, username, callback) {
  req.session.regenerate((err) => {
    if (err) return callback(err);
    req.session.username = username;
    req.session.save(callback);
  });
}

// Usernames and passwords must be text, and bcrypt only uses the first 72 bytes of a password
function validCredentialInput(username, password) {
  return typeof username === "string" && typeof password === "string" && Buffer.byteLength(password) <= 72;
}

// Find the user whose username or email matches and whose password matches its stored hash
async function findUser(login, password) {
  for (const user of db.prepare("SELECT username, password FROM users WHERE username = ? OR email = ?").all(login, login)) {
    if (BCRYPT_HASH.test(user.password) && (await bcrypt.compare(password, user.password))) return user;
  }
}

// Hash any password still stored in plain text. Runs on every start and does nothing once none are left;
// skips an empty database (no users table yet) and never stops the server on failure.
async function migratePasswords() {
  try {
    if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'users'").get()) return;

    const users = db.prepare("SELECT username, password FROM users WHERE typeof(password) = 'text' AND password NOT GLOB '$2[aby]$*'").all();
    for (const user of users) {
      db.prepare("UPDATE users SET password = ? WHERE username = ? AND password = ?").run(await bcrypt.hash(user.password, 10), user.username, user.password);
    }

    if (users.length) console.log(`Hashed ${users.length} stored passwords`);
  } catch (error) {
    console.error("Password migration failed:", error.message);
  }
}

function userExists(username) {
  const query = db.prepare("SELECT * FROM users WHERE username = ?");
  return query.get(username) != undefined;
}

function emailExists(email) {
  const query = db.prepare("SELECT * FROM users WHERE email = ?");
  return query.get(email) != undefined;
}

function inWatchlist(user, movieid) {
  if (!user) return false;

  const query = db.prepare("SELECT * FROM watchlist WHERE (username = ? AND movieid = ?);");
  return query.get(user.username, movieid) != undefined;
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
