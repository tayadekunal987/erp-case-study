const express = require("express");

const {
    createDispatch,
    getDispatches
} = require("../controllers/dispatchController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// View dispatches
router.get(
    "/",
    authenticateToken,
    getDispatches
);


// Admin creates dispatch
router.post(
    "/",
    authenticateToken,
    authorizeRoles("ADMIN"),
    createDispatch
);


module.exports = router;