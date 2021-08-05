const express = require("express");
const morgan = require("morgan")
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080; // default port 8080

const users = {};

function generateRandomString() {
  let string = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++)
    string += possible.charAt(Math.floor(Math.random() * possible.length));

  return string;

};

const emailChecker = (email) => {
  for (let x in users) {
    if (email === users[x].email) {
      return true;
    }
  }
  return false;
};


app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Middleware

app.use(bodyParser.urlencoded({extended: true}));

app.use(morgan("dev"))

app.use(cookieParser())

// End Points

// Get request

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/login", (req, res) => {
  const userID = [req.cookies.user_id]
  const user = users[userID]
  const templateVars = { user }
  if (userID[0]) {
    res.redirect("/urls")
    return;
  }
  res.render("login", templateVars)
});

app.get("/register", (req, res) => {
  const userID = [req.cookies.user_id]
  const user = users[userID]
  const templateVars = { user }
  if (userID[0]) {
    res.redirect("/urls")
    return;
  }
  res.render("register", templateVars)
})

app.get("/urls", (req, res) => {
  const userID = [req.cookies.user_id]
  const user = users[userID]
  const templateVars = { 
    urls: urlDatabase,
    user
  };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const userID = [req.cookies.user_id]
  const user = users[userID]
  const templateVars = { 
    urls: urlDatabase,
    user
  };
  if (!userID[0]) {
    res.redirect("/login")
    return;
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = [req.cookies.user_id]
  const user = users[userID]
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
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
  const email = req.body.email
  const password = req.body.password
  if (!emailChecker(email)) {
    res.sendStatus(403)
    return;
  }
  for (let x in users) {
    if (email === users[x].email && password === users[x].password) {
        const userID = users[x].id
        res.cookie("user_id", userID)
        res.redirect("/urls");
        return;
      }
     }
  res.sendStatus(403);
  return;
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect("/urls")
})

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.sendStatus(400)
    return;
  } else if (emailChecker(req.body.email)) {
    res.sendStatus(400)
    return;
  }

  const userID = "user" + generateRandomString()
  const user = { 
    id: userID, 
    email: req.body.email, 
    password: req.body.password 
};
  users[userID] = user;
  res.cookie("user_id", userID);
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const userID = [req.cookies.user_id]
  const user = users[userID]
  const id = generateRandomString();
  const URL = req.body.longURL
  if (!userID[0]) {
    res.sendStatus(403);
    return;
  }
  urlDatabase[id] = URL
  res.redirect("/urls/" + id)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.params.shortURL;
  delete urlDatabase[id];
  res.redirect("/urls")
});

app.post("/urls/:shortURL/update", (req, res) => {
  const id = req.params.shortURL;
  const newURL = req.body.newURL
  urlDatabase[id] = newURL
  res.redirect("/urls")
}); 

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});