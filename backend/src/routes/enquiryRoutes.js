const express = require("express");

const {
    createEnquiry,
    getEnquiries,
    getEnquiryById
} = require("../controllers/enquiryController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    authenticateToken,
    authorizeRoles("SALES_USER", "ADMIN"),
    createEnquiry
);

router.get(
    "/",
    authenticateToken,
    getEnquiries
);

router.get(
    "/:id",
    authenticateToken,
    getEnquiryById
);

module.exports = router;