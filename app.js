const express = require("express")
require("express-async-errors")
require("dotenv").config() // to load the .env file into the process.env object
const app = express()
const cookieParser = require('cookie-parser')
const session = require("express-session")

app.set("view engine", "ejs")
app.use(require("body-parser").urlencoded({ extended: true }))

const MongoDBStore = require("connect-mongodb-session")(session)
const url = process.env.MONGO_URI

const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: url,
  collection: "mySessions",
})

store.on("error", function (error) {
  console.log(error)
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
}

if (app.get("env") === "production") {
  app.set("trust proxy", 1) // trust first proxy
  sessionParms.cookie.secure = true // serve secure cookies
}


//csrf protection
const csrf = require('host-csrf')

app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.urlencoded({ extended: false }));
let csrf_development_mode = true;
if (app.get("env") === "production") {
  csrf_development_mode = false;
  app.set("trust proxy", 1);
}

const csrf_options = {
  protected_operations: ["PATCH"],
  protected_content_types: ["application/json"],
  development_mode: csrf_development_mode,
};

const csrf_middleware = csrf(csrf_options); //initialise and return middlware

app.use((req,res,next)=> {
  if (req.path == "/multiply") {
    res.set("Content-Type","application/json")
  } else {
    res.set("Content-Type","text/html")
  }
  next()
})

app.get("/multiply", (req,res)=> {
  const result = req.query.first * req.query.second
  if (result.isNaN) {
    result = "NaN"
  } else if (result == null) {
    result = "null"
  }
  res.json({result: result})
})

app.use(session(sessionParms))
app.use(require("connect-flash")()) //sessions required

//Passport, sessions required
const passport = require("passport")
const passportInit = require("./passport/passportInit")
passportInit()
app.use(passport.initialize())
app.use(passport.session())

app.use(csrf_middleware)

//storeLocalsMW
app.use(require("./middleware/storeLocals"))
app.get("/", csrf_middleware, (req, res) => {
  res.render("index")
})

//MW for unauthed access to secret
const secretWordRouter = require("./routes/secretWord")
const jobs = require("./routes/jobs")
const auth = require("./middleware/auth")

app.use("/jobs", auth, csrf_middleware, jobs)
app.use("/secretWord", auth, csrf_middleware, secretWordRouter)
app.use("/sessions", require("./routes/sessionRoutes"))

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`)
})



app.use((err, req, res, next) => {
  res.status(500).send(err.message)
  console.log(err)
})

const port = process.env.PORT || 3000;
const start = () => {
  try {
    require("./db/connect")(url);
    return app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`),
    );
  } catch (error) {
    console.log(error)
  }
};

const server = start()

module.exports = { app, server }