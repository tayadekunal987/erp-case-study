const express = require("express");

const {
    convertQuotationToOrder,
    getSalesOrders,
    getSalesOrderById,
    confirmSalesOrder,
    cancelSalesOrder
} = require("../controllers/salesOrderController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// View orders
router.get(
    "/",
    authenticateToken,
    getSalesOrders
);

// View order by ID
router.get(
    "/:id",
    authenticateToken,
    getSalesOrderById
);


// Convert accepted quotation
router.post(
    "/from-quotation/:quotationId",
    authenticateToken,
    authorizeRoles("SALES_USER", "ADMIN"),
    convertQuotationToOrder
);


// Admin confirms + reserves inventory
router.post(
    "/:id/confirm",
    authenticateToken,
    authorizeRoles("ADMIN"),
    confirmSalesOrder
);


// Admin cancels order
router.post(
    "/:id/cancel",
    authenticateToken,
    authorizeRoles("ADMIN"),
    cancelSalesOrder
);


module.exports = router;