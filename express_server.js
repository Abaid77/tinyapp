const express = require("express");
const morgan = require("morgan");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const { emailChecker, generateRandomString, urlsForUser, getUserByEmail, getDateTime } = require("./helpers");
const app = express();
const PORT = 8080; // default port 8080

// Create users and database objects

const users = {};

const urlDatabase = {};


// Settings

app.set("view engine", "ejs");


// Middleware

app.use(bodyParser.urlencoded({extended: true}));

app.use(morgan("dev"));

app.use(cookieSession({
  name: 'user_id',
  keys: ["super secret 1", "super secret 2"],
}));



// End Points

// Get request

app.get("/", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect("/urls");
    return;
  } else {
    res.redirect("/login");
    return;
  }
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect("/urls");
    return;
  }
  const user = users[userID];
  const templateVars = { user };
  
  res.render("login", templateVars);
});

app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  const templateVars = { user };
  if (userID) {
    res.redirect("/urls");
    return;
  }
  res.render("register", templateVars);
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.redirect("/not_logged");
    return;
  }
  const user = users[userID];
  const urls = urlsForUser(userID, urlDatabase);
  const templateVars = {
    urls: urls,
    user
  };
  res.render("urls_index", templateVars);
});

app.get("/not_logged", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  const templateVars = { user };
  res.render("not_logged", templateVars);
});


app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  const templateVars = {
    urls: urlDatabase[req.params.shortURL],
    user
  };
  if (!userID) {
    res.redirect("/login");
    return;
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  let realURL = false;
  for (let x in urlDatabase) {
    if (shortURL === x) {
      realURL = true;
    }
  }
  if (!realURL) {
    res.status(400).send("That URL does not exsist.");
  }
  if (!userID) {
    res.redirect("/not_logged");
    return;
  }
  let exsist = false;
  let tempDatabase = urlsForUser(userID, urlDatabase);
  for (let x in tempDatabase) {
    if (shortURL === x) {
      exsist = true;
    }
  }
  
  if (!exsist) {
    res.send("You can only use your own short URLs!");
    return;
  }
  const user = users[userID];
  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    date: urlDatabase[req.params.shortURL].date,
    user
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let exsist = false;
  for (let id in urlDatabase) {
    if (req.params.shortURL === id) {
      exsist = true;
    }
  }
  if (!exsist) {
    res.status(400).send("URL does not exsist");
    return;
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Post request

app.post("/login", (req, res) => {
  const email = req.body.email;
  // check for email address in data base
  if (!emailChecker(email, users)) {
    res.status(403).send("Login failed");
    return;
  }
  for (let x in users) {
    let compare = false;
    compare = bcrypt.compareSync(req.body.password, users[x].password);
    if (email === users[x].email && compare) {
      const userID = users[x].id;
      req.session.user_id = userID;
      res.redirect("/urls");
      return;
    }
  }
  res.status(403).send("Login failed");
  return;
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Must fill in all fields");
    return;
  } else if (emailChecker(req.body.email, users)) {
    res.status(400).send("Email already in use");
    return;
  }

  const userID = "user" + generateRandomString();
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  const user = {
    id: userID,
    email: req.body.email,
    password: hashedPassword
  };
  users[userID] = user;
  req.session.user_id = userID;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  const id = generateRandomString();
  const URL = req.body.longURL;
  if (!userID) {
    res.status(403).send("Must be logged in");
    return;
  }
  if (!URL) {
    res.status(403).send("Must enter a URL");
    return;
  }
  
  const tempObj = {
    [id]: {
      longURL: URL,
      userID: userID,
      date: getDateTime()
    }
  };
  const tempurlDatabase = Object.assign(urlDatabase, tempObj);
  res.redirect("/urls/" + id);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  if (!userID) {
    res.sendStatus(403);
    return;
  }
  let exsist = false;
  let tempDatabase = urlsForUser(userID, urlDatabase);
  for (let x in tempDatabase) {
    if (shortURL === x) {
      exsist = true;
    }
  }
  if (!exsist) {
    res.send("You can only use your own short URLs!");
    return;
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/update", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.user_id;
  const newURL = req.body.newURL;
  if (!userID) {
    res.sendStatus(403);
    return;
  }
  let exsist = false;
  let tempDatabase = urlsForUser(userID, urlDatabase);
  for (let x in tempDatabase) {
    if (shortURL === x) {
      exsist = true;
    }
  }
  
  if (!exsist) {
    res.send("You can only use your own short URLs!");
    return;
  }
  urlDatabase[shortURL].longURL = newURL;
  res.redirect("/urls");
});

// Server startup

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});