const express = require("express");
const morgan = require("morgan")
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080; // default port 8080

const users = {};

const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
  }
};

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
  const userIDArray = [req.cookies.user_id]
  const userID = userIDArray[0];
  console.log(userID)
  const user = users[userID]
  const templateVars = { user }
  if (userID) {
    res.redirect("/urls")
    return;
  }
  res.render("login", templateVars)
});

app.get("/register", (req, res) => {
  const userIDArray = [req.cookies.user_id]
  const userID = userIDArray[0];
  const user = users[userID]
  const templateVars = { user }
  if (userID) {
    res.redirect("/urls")
    return;
  }
  res.render("register", templateVars)
})

app.get("/urls", (req, res) => {
  const userID = [req.cookies.user_id]
  const user = users[userID]
  const shortURL = req.params.shortURL;
  console.log(urlDatabase)
  const templateVars = { 
    urls: urlDatabase,
    user
  };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const userIDArray = [req.cookies.user_id]
  const userID = userIDArray[0];
  const user = users[userID]
  const shortURL = req.params.shortURL;
  const templateVars = { 
    urls: urlDatabase[req.params.shortURL],
    user
  };
  if (!userID) {
    res.redirect("/login")
    return;
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userIDArray = [req.cookies.user_id]
  const userID = userIDArray[0];
  const user = users[userID]
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL,
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
    res.sendStatus(400)
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
  const userIDArray = [req.cookies.user_id]
  const userID = userIDArray[0];
  const user = users[userID]
  const id = generateRandomString();
  const URL = req.body.longURL
  if (!userID) {
    res.sendStatus(403);
    return;
  }
  if(!URL) {
    res.sendStatus(403);
    return;
  }
  const tempObj = {
    [id]: {
      longURL: URL,
      userID: userID[0]
    }
  }
  const tempurlDatabase = Object.assign(urlDatabase, tempObj)
  console.log(urlDatabase)
  res.redirect("/urls/" + id)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.params.shortURL;
  delete urlDatabase[id];
  res.redirect("/urls")
});

app.post("/urls/:shortURL/update", (req, res) => {
  const id = req.params.shortURL;
  const userIDArray = [req.cookies.user_id]
  const userID = userIDArray[0];
  const newURL = req.body.newURL;
  if (!userID) {
    res.sendStatus(403);
    return;
  }
  urlDatabase[id] = newURL
  res.redirect("/urls")
}); 

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});