const express = require("express");
const user = require("./Models/Event.js");
const { IDGenerator, generateAvailability } = require("./utils.js");

var router = express.Router()

router.get("/", function (req, res) {
  user
    .find()
    .then((users) => res.json(users))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.get("/:id", function (req, res) {
  user
    .findById(req.params.id)
    .then((doc) => res.json(doc))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.post("/add", function (req, res) {
  console.log(req.body)
  const event_name = req.body.event_name;
  const start_date = req.body.start_date;
  const end_date = req.body.end_date;

  const windowOrder  = ["morning", "afternoon", "evening"];
  const windowBounds = {
    morning:   { start_time: "06:00", end_time: "11:00" },
    afternoon: { start_time: "12:00", end_time: "17:00" },
    evening:   { start_time: "18:00", end_time: "23:00" },
  };
  const raw     = Array.isArray(req.body.windows) ? req.body.windows : ["morning", "afternoon", "evening"];
  const sorted  = raw.filter(w => windowBounds[w]).sort((a, b) => windowOrder.indexOf(a) - windowOrder.indexOf(b));
  const windows = sorted.length ? sorted : ["morning", "afternoon", "evening"];
  const start_time = windowBounds[windows[0]].start_time;
  const end_time   = windowBounds[windows[windows.length - 1]].end_time;
  const time_mode  = windows.join("+");

  const availability = generateAvailability(
    start_date,
    end_date,
    start_time,
    end_time
  );

  const newUser = new user({
    event_name,
    start_date,
    end_date,
    users: [],
    start_time,
    end_time,
    time_mode,
    availability,
  });
  newUser
    .save()
    .then(() => res.json(newUser.id))
    .catch((err) => res.status(400).json("Error: " + err));
});

router.put("/:id/adduser", function (req, res) {
  const userName = req.body.user;
  const ID = IDGenerator();
  const userObject = { id: ID, name: userName };
  user
    .updateOne(
      { _id: req.params.id },
      { $push: { users: userObject } },
      { runValidators: true }
    )
    .then(() => res.json({ message: "Successfully added user", id: ID }))
    .catch((err) => console.log(err));
});

router.put("/:id/update", function (req, res) {
  const avail = req.body.availability;
  user
    .updateOne(
      { _id: req.params.id },
      { availability: avail },
      { runValidators: true }
    )
    .then(() =>
      res.json({ message: "Successfully updated availability of user" })
    );
});

module.exports = router;
