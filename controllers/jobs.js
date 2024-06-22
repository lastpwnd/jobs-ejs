const Job = require("../models/Job")
const parseVErr = require("../utils/parseValidationErrs")
let job

const showAllJobs = async (req, res, next) => {
    let jobs;
  try {
    jobs = await Job.find({ createdBy: req.user._id });
  } catch (e) {
    if (e.constructor.name === "ValidationError") {
      parseVErr(e, req);
    } else {
      return next(e);
    }
    return res.status(400).render("register", { errors: req.flash("errors") });
  }
  res.render("jobs", { info: req.query.info, jobs });
}
const addNewList = async (req, res, next) => {
    try {
        await Job.create({ ...req.body, createdBy: req.user._id });
      } catch (e) {
        if (e.constructor.name === "ValidationError") {
          parseVErr(e, req);
        } else {
          return next(e);
        }
        return res.status(400).render("register", { errors: req.flash("errors") });
      }
      res.redirect("/jobs");
}
const createJob = (req, res, next) => {
    res.render("job", { job: null })
}
const editJob = async (req, res, next) => {
  try {
   job =  await Job.findOne({ _id: req.params.id, createdBy: req.user._id });
  } catch (e) {
    if (e.constructor.name === "ValidationError") {
      parseVErr(e, req);
    } else {
      return next(e);
    }
    return res.status(400).render("register", { errors: req.flash("errors") });
  }
  res.render("job", { job });
}
const updateJob = async (req, res, next) => {
    try {
       job = await Job.findOneAndUpdate(
          { _id: req.params.id, createdBy: req.user._id },
          { ...req.body }
        );
      } catch (e) {
        if (e.constructor.name === "ValidationError") {
          parseVErr(e, req);
        } else {
          return next(e);
        }
        return res.status(400).render("register", { errors: req.flash("errors") });
      }
      res.redirect("/jobs");
}
const deleteJob = async (req, res, next) => {
    try {
        await Job.deleteOne({ _id: req.params.id, createdBy: req.user._id });
      } catch (e) {
        if (e.constructor.name === "ValidationError") {
          parseVErr(e, req);
        } else {
          return next(e);
        }
        return res.status(400).render("register", { errors: req.flash("errors") });
      }
      res.redirect("/jobs");
}

module.exports = {
    showAllJobs,
    addNewList,
    createJob,
    editJob,
    updateJob,
    deleteJob
}