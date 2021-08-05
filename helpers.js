const urlsForUser = (id, urlDatabase) => {
  let output = {};
  for (let x in urlDatabase) {
    if (urlDatabase[x].userID === id) {
      output[x] = urlDatabase[x];
      
    }
  }
  return output;
};

const generateRandomString = () => {
  let string = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++)
    string += possible.charAt(Math.floor(Math.random() * possible.length));

  return string;

};

const emailChecker = (email, users) => {
  for (let x in users) {
    if (email === users[x].email) {
      return true;
    }
  }
  return false;
};

const getUserByEmail = (email, users) => {
  let user = "";
  for (let x in users) {
    if (email === users[x].email) {
      user = users[x].id;
      return user;
    }
  }
  return undefined;
};

const getDateTime = () => {
  const date = new Date();
  const n = date.toDateString();
  const time = date.toLocaleTimeString();
  const output = `${n} at ${time}`;
  return output;
};

module.exports = { emailChecker, generateRandomString, urlsForUser, getUserByEmail, getDateTime };