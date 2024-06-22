const express = require("express")
const router = express.Router()

const {
    showAllJobs,
    addNewList,
    createJob,
    editJob,
    updateJob,
    deleteJob
} = require("../controllers/jobs")


router.route("/").get(showAllJobs).post(addNewList)
router.route("/new").get(createJob)
router.route("/edit/:id").get(editJob)
router.route("/update/:id").post(updateJob)
router.route("/delete/:id").post(deleteJob)

module.exports = router