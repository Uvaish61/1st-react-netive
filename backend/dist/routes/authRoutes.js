"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// User login route
router.post('/login', authController_1.login);
// User signup route
router.post('/signup', authController_1.signup);
exports.default = router;
