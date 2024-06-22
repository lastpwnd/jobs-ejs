const puppeteer = require("puppeteer")
const { server } = require("../app")
const { seed_db, testUserPassword, factory } = require("../utils/seed_db")
const Jobs = require("../models/Job")
const chai = require("chai")
chai.use(require("chai-http"))
const { describe, before, after, it } = require("mocha")
const { expect } = chai

let testUser = null

//tested, works
const runTests = async () => {
  let page = null
  let browser = null

  describe("Testing sequence...", function () {

    before(async function () {
      this.timeout(10000)
      browser = await puppeteer.launch()
      page = await browser.newPage()
      await page.goto("http://localhost:3000")
    })

    after(async function () {
      this.timeout(5000)
      await browser.close()
      server.close()
      return
    })

    describe("Index Page Testing...", function () {
      this.timeout(10000)

      it("Index Page, looking for LogOn link...", async () => {
        this.logonLink = await page.waitForSelector(
          "a ::-p-text(Click this link to logon)",
        )
      })

      it("Going to LogOn Page...", async () => {
        await this.logonLink.click()
        await page.waitForNavigation()
      })
    })

    describe("LogOn Page Testing...", function () {
      //console.log("at line 48", this.outerd, this.innerd, this.secondIt)
      this.timeout(20000)

      it("Resolving all fields...", async () => {
        this.email = await page.waitForSelector("input[name=email]")
        this.password = await page.waitForSelector("input[name=password]")
        this.submit = await page.waitForSelector("button ::-p-text(Logon)")
      })

      it("Loggin in...", async () => {
        testUser = await seed_db()
        await this.email.type(testUser.email)
        await this.password.type(testUserPassword)
        await this.submit.click()
        await page.waitForNavigation()
        // <p>Logged in as: "<%= user.name %>"</p>
        await page.waitForSelector(
          `p ::-p-text(Logged in as: "${testUser.name}")`
        )
        await page.waitForSelector("a ::-p-text(change the secret")
        await page.waitForSelector('a[href="/secretWord"]')
        const copyright = await page.waitForSelector("p ::-p-text(rum)")
        const copyrightText = await copyright.evaluate((ele) => ele.textContent)
        console.log("Copyright text: ", copyrightText)
      })
    })

    describe("Testing Jobs Page...", function () {
      this.timeout(20000)

      it("Looking for the link...", async () => {
        this.jobLink = await page.waitForSelector('a[href="/jobs"]')
      })

      it("Going to the Jobs Page...", async () => {
        this.timeout(20000)
        await this.jobLink.click()
        await page.waitForNavigation()
        const content = await page.content()
        expect(content.split("<tr>").length).equal(21)
      })

      it("Adding the job...", async () => {
        this.timeout(20000)
        this.jobAdd = await page.waitForSelector('a[href="/jobs/new"]')
        await this.jobAdd.click()
        await page.waitForNavigation()
      })

      it("Resolving all fields...", async () => {
        this.timeout(20000)
        this.company = await page.waitForSelector("input[name=company]")
        this.position = await page.waitForSelector("input[name=position]")
        this.status = await page.waitForSelector("select[name=status]")
        this.addJob = await page.waitForSelector("button ::-p-text(add)")
      })

    let job

      it("Sending data...", async () => {
        this.timeout(20000)
        job = await factory.build("job")
        await this.company.type(job.company)
        await this.position.type(job.position)
        await this.status.type(job.status)
        await this.addJob.click()
        await page.waitForNavigation()
        console.log("Data to be sent -> \n company: ", job.company, "\n position: ",  job.position, "\n status: ", job.status )
      })

      it("Checking the database and confirming result...", async () => {
        this.timeout(20000)
        await page.waitForSelector("table")
        let result = await Jobs.find({
          company: job.company,
          position: job.position,
          status: job.status
        })
        console.log(result)
      })
    })
  })
}

runTests()