const chai = require("chai")
chai.use(require("chai-http"))
const { app, server } = require("../../app")
const expect = require('chai').expect
const { describe, it, after } = require("mocha")
const { testUserPassword, seed_db } = require("../../utils/seed_db")
const Job = require("../../models/Job")

//tested, works
describe("test seeded database", async function () {
  after(() => {
    server.close()
  })

  let vars = {}
  it("should get 20 jobs", async function () {
    this.timeout(5000)
    vars.user = await seed_db()

    // Getting csrfToken
    let res
    try {
      res = await chai.request(app).get("/sessions/register").send()
      expect(res).to.have.status(200)
      const textNoLineEnd = res.text.replaceAll("\n", "")
      const csrfToken = /_csrf" value="(.*?)"/.exec(textNoLineEnd)
      expect(csrfToken).to.not.be.null
      vars.csrfToken = csrfToken[1]
      expect(res).to.have.property("headers")
      expect(res.headers).to.have.property("set-cookie")
      const cookies = res.headers["set-cookie"]
      const csrfCookie = cookies.find((element) =>
        element.startsWith("csrfToken")
      )
      expect(csrfCookie).to.not.be.undefined
      const cookieValue = /csrfToken=(.*?);\s/.exec(csrfCookie)
      vars.csrfCookie = cookieValue[1]
    } catch (error) {
      console.log(error)
    }

    let dataToPost = {
      email: vars.user.email,
      password: testUserPassword,
      _csrf: vars.csrfToken,
    };

    // Loggin in
    try {
      const request = chai
        .request(app)
        .post("/sessions/logon")
        .set("Cookie", `csrfToken=${vars.csrfCookie}`)
        .set("content-type", "application/x-www-form-urlencoded")
        .redirects(0)
        .send(dataToPost)
      const res = await request
      expect(res).to.have.status(302)
      expect(res.headers.location).to.equal("/")
      const cookies = res.headers["set-cookie"]
      vars.sessionCookie = cookies.find((element) => {
        return element.startsWith("connect.sid")
      })
      expect(vars.sessionCookie).to.not.be.undefined
    } catch (err) {
      console.log(err)
    }

    // Getting jobs
    dataToPost = {
      _csrf: vars.csrfToken,
    }
    try {
      let res = await chai
        .request(app)
        .get("/jobs")
        .set("Cookie", `csrfToken=${vars.csrfToken};${vars.sessionCookie}`)
        .send(dataToPost)
      const pageParts = res.text.split("<tr>").length
      expect(pageParts).to.equal(21)
    } catch (error) {
      console.log(error)
    }
  })

  it("should add a new job", async function () {
    const faker = require("@faker-js/faker").fakerEN_US
    let job = {
      company: faker.company.name(),
      position: faker.person.jobTitle(),
      status: (() =>
        ["interview", "declined", "pending"][Math.floor(3 * Math.random())])(), 
    }

    // Job posting
    let dataToPost = {
      _csrf: vars.csrfToken,
      ...job,
    }
    let res

    try {
      res = await chai
        .request(app)
        .post("/jobs")
        .set("Cookie", `csrfToken=${vars.csrfCookie};${vars.sessionCookie}`)
        .set("content-type", "application/x-www-form-urlencoded")
        .redirects(0)
        .send(dataToPost)
      expect(res).status(302)
    } catch (error) {
      console.log(error)
    }
    let result = await Job.find(job)
    expect(result.length).equals(1)
  })
})