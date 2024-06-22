const chai = require("chai")
chai.use(require("chai-http"))
const { app, server } = require("../../app")
const { expect } = chai
const { describe, it, after } = require("mocha")
const { factory } = require("../../utils/seed_db")
const faker = require("@faker-js/faker").fakerEN_US
const User = require("../../models/User")

describe("tests for registration and logon", function () {
  after(() => {
    server.close()
  })
  //tested, works
  it("should get the registration page", (done) => {
    chai
      .request(app)
      .get("/sessions/register")
      .send()
      .end((err, res) => {
        expect(err).to.equal(null)
        expect(res).to.have.status(200)
        expect(res).to.have.property("text")
        expect(res.text).to.include("Enter your name")
        const textNoLineEnd = res.text.replaceAll("\n", "")
        const csrfToken = /_csrf" value="(.*?)"/.exec(textNoLineEnd)
        expect(csrfToken).to.not.be.null
        this.csrfToken = csrfToken[1]
        expect(res).to.have.property("headers")
        expect(res.headers).to.have.property("set-cookie")
        const cookies = res.headers["set-cookie"]
        const csrfCookie = cookies.find((element) =>
          element.startsWith("csrfToken")
        )
        expect(csrfCookie).to.not.be.undefined
        const cookieValue = /csrfToken=(.*?)\s/.exec(csrfCookie)
        this.csrfCookie = cookieValue[1]
        done()
      })
  }) 

  //tested, works
  it("should register the user", async () => {
    this.password = faker.internet.password()
    this.user = await factory.build("user", { password: this.password })
    const dataToPost = {
      name: this.user.name,
      email: this.user.email,
      password: this.password,
      password1: this.password,
      _csrf: this.csrfToken,
    }
    try {
      const request = chai
        .request(app)
        .post("/sessions/register")
        .set("Cookie", `csrfToken=${this.csrfCookie}`)
        .set("content-type", "application/x-www-form-urlencoded")
        .send(dataToPost)
      const res = await request
      console.log("got here")
      expect(res).to.have.status(200)
      expect(res).to.have.property("text")
      expect(res.text).to.include("Jobs List")
      const newUser = await User.findOne({ email: this.user.email })
      expect(newUser).to.not.be.null
      console.log(newUser)
    } catch (err) {
      console.log(err)
      expect.fail("Register request failed")
    }
  })
  
  //tested, works
  it("should log the user on", async () => {
    const dataToPost = {
      email: this.user.email,
      password: this.password,
      _csrf: this.csrfToken,
    }
    try {
      const request = chai
        .request(app)
        .post("/sessions/logon")
        .set("Cookie", `csrfToken=${this.csrfCookie}`)
        .set("content-type", "application/x-www-form-urlencoded")
        .redirects(0)
        .send(dataToPost)
      const res = await request
      expect(res).to.have.status(302)
      expect(res.headers.location).to.equal("/")
      const cookies = res.headers["set-cookie"]
      this.sessionCookie = cookies.find((element) => {
        return element.startsWith("connect.sid")
      })
      expect(this.sessionCookie).to.not.be.undefined
    } catch (err) {
      console.log(this.csrfCookie)
      console.log(err)
      expect.fail("Logon request failed")
    }
  })

  //tested, works
  it("should get the index page", (done) => {
    chai
      .request(app)
      .get("/")
      .set("Cookie", this.sessionCookie)
      .send()
      .end((err, res) => {
        expect(err).to.equal(null)
        expect(res).to.have.status(200)
        expect(res).to.have.property("text")
        expect(res.text).to.include(this.user.name)
        done()
      })
  })

  //tested, works
  it("should logoff the user", (done) => {
    const dataToPost = {
      _csrf: this.csrfToken,
    }
    try {
      chai
        .request(app)
        .post("/sessions/logoff")
        .set(
          "Cookie",
          `csrfToken=${this.csrfCookie}` + "" + this.sessionCookie
        )
        .set("content-type", "application/x-www-form-urlencoded")
        .send(dataToPost)
        .end((err, res) => {
          expect(err).to.equal(null)
          expect(res).to.have.status(200)
          expect(res).to.have.property("text")
          expect(res.text).to.not.include(this.user.name)
          done()
        })
    } catch (err) {
      console.log(err)
      expect.fail("Logoff request failed")
    }
  })
})