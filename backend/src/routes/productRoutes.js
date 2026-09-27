const express = require("express");

const {
    getProducts,
    getProductById
} = require("../controllers/productController");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    getProducts
);

router.get(
    "/:id",
    authenticateToken,
    getProductById
);

module.exports = router;