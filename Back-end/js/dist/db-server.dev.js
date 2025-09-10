"use strict";

var express = require("express");

var bodyParser = require("body-parser");

var bcrypt = require("bcrypt");

var cors = require("cors");

var _require = require("pg"),
    Pool = _require.Pool;

var app = express();
var PORT = 5000; // PostgreSQL connection

var pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "readbuddyDB",
  password: "errorsyntax0!",
  port: 5432
});
app.use(cors());
app.use(bodyParser.json());
/**
 * Teacher Registration
 */

app.post("/register", function _callee(req, res) {
  var _req$body, fullname, email, password, hashedPassword, newTeacher;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _req$body = req.body, fullname = _req$body.fullname, email = _req$body.email, password = _req$body.password; // hash password

          _context.next = 4;
          return regeneratorRuntime.awrap(bcrypt.hash(password, 10));

        case 4:
          hashedPassword = _context.sent;
          _context.next = 7;
          return regeneratorRuntime.awrap(pool.query("INSERT INTO teachers (fullname, email, password) VALUES ($1, $2, $3) RETURNING *", [fullname, email, hashedPassword]));

        case 7:
          newTeacher = _context.sent;
          res.json({
            success: true,
            teacher: newTeacher.rows[0]
          });
          _context.next = 15;
          break;

        case 11:
          _context.prev = 11;
          _context.t0 = _context["catch"](0);
          console.error(_context.t0);
          res.status(500).json({
            success: false,
            message: "Registration failed"
          });

        case 15:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 11]]);
});
/**
 * Teacher Login
 */

app.post("/login", function _callee2(req, res) {
  var _req$body2, email, password, teacher, validPassword;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _req$body2 = req.body, email = _req$body2.email, password = _req$body2.password;
          _context2.next = 4;
          return regeneratorRuntime.awrap(pool.query("SELECT * FROM teachers WHERE email = $1", [email]));

        case 4:
          teacher = _context2.sent;

          if (!(teacher.rows.length === 0)) {
            _context2.next = 7;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            success: false,
            message: "Invalid email or password"
          }));

        case 7:
          _context2.next = 9;
          return regeneratorRuntime.awrap(bcrypt.compare(password, teacher.rows[0].password));

        case 9:
          validPassword = _context2.sent;

          if (validPassword) {
            _context2.next = 12;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            success: false,
            message: "Invalid email or password"
          }));

        case 12:
          res.json({
            success: true,
            teacher: teacher.rows[0]
          });
          _context2.next = 19;
          break;

        case 15:
          _context2.prev = 15;
          _context2.t0 = _context2["catch"](0);
          console.error(_context2.t0);
          res.status(500).json({
            success: false,
            message: "Login failed"
          });

        case 19:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 15]]);
});
app.listen(PORT, function () {
  console.log("Server running on http://localhost:".concat(PORT));
}); //RUN THE SERVER WITH: node Back-end/js/db-server.js