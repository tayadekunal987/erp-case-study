const express = require("express");

const {
    createQuotation,
    updateQuotationStatus,
    getQuotations
} = require("../controllers/quotationController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// Create quotation
router.post(
    "/",
    authenticateToken,
    authorizeRoles("SALES_USER", "ADMIN"),
    createQuotation
);


// View quotations
router.get(
    "/",
    authenticateToken,
    getQuotations
);


// Change quotation status
router.patch(
    "/:id/status",
    authenticateToken,
    authorizeRoles("SALES_USER", "ADMIN"),
    updateQuotationStatus
);


module.exports = router;