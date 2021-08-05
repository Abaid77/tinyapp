const express = require("express");
const morgan = require("morgan")
const cookieSession = require('cookie-session')
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080; // default port 8080

// Create users and database objects

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

const urlsForUser = (id) => {
  let output = {};
  for (let x in urlDatabase) {
    if (urlDatabase[x].userID === id) {
      output[x] = urlDatabase[x]
      
    }
  }
  return output;
};

// Functions

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
  res.send("Hello!");
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id
  if (userID) {
    res.redirect("/urls")
    return;
  };
  const user = users[userID]
  const templateVars = { user }
  
  res.render("login", templateVars)
});

app.get("/register", (req, res) => {
  const userID = req.session.user_id
  const user = users[userID]
  console.log(user)
  const templateVars = { user }
  if (userID) {
    res.redirect("/urls")
    return;
  }
  res.render("register", templateVars)
})

app.get("/urls", (req, res) => {
  const userID = req.session.user_id
  if(!userID) {
    res.redirect("/not_logged")
    return;
  }
  const user = users[userID]
  const shortURL = req.params.shortURL;
  const urls = urlsForUser(userID)
  const templateVars = { 
    urls: urls,
    user
  };
  res.render("urls_index", templateVars);
});

app.get("/not_logged", (req, res) => {
  const userID = req.session.user_id
  const user = users[userID]
  const templateVars = { user }
  res.render("not_logged", templateVars)
})


app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id
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
  const userID = req.session.user_id
  const shortURL = req.params.shortURL
  if(!userID) {
    res.redirect("/not_logged")
    return;
  }
  let exsist = false;
  let tempDatabase = urlsForUser(userID)
  for (let x in tempDatabase) {
    if (shortURL === x) {
      exsist = true;
    }
  };
  
  if (!exsist) {
    res.send("You can only use your own short URLs!")
    return;
  }
  const user = users[userID]
  const templateVars = { 
    shortURL: shortURL, 
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
  // check for email address in data base
  if (!emailChecker(email)) {
    res.status(403).send("Login failed")
    return;
  }
  for (let x in users) {
    let compare = false;
    compare = bcrypt.compareSync(req.body.password, users[x].password)
    if (email === users[x].email && compare) {
        const userID = users[x].id
        req.session.user_id = userID;
        res.redirect("/urls");
        return;
      }
     }
  res.status(403).send("Login failed");
  return;
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect("/urls")
})

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Must fill in all fields")
    return;
  } else if (emailChecker(req.body.email)) {
    res.status(400).send("Email already in use")
    return;
  }

  const userID = "user" + generateRandomString()
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
  const userID = req.session.user_id
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
      userID: userID
    }
  }
  const tempurlDatabase = Object.assign(urlDatabase, tempObj)
  res.redirect("/urls/" + id)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.params.shortURL;
  const userID = req.session.user_id
  if (!userID) {
    res.sendStatus(403);
    return;
  }
  delete urlDatabase[id];
  res.redirect("/urls")
});

app.post("/urls/:shortURL/update", (req, res) => {
  const id = req.params.shortURL;
  const userID = req.session.user_id
  const newURL = req.body.newURL;
  if (!userID) {
    res.sendStatus(403);
    return;
  }
  urlDatabase[id] = newURL
  res.redirect("/urls")
}); 

// Server startup

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});