const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");
const productRoutes = require("./routes/productRoutes");
const quotationRoutes = require("./routes/quotationRoutes");
const salesOrderRoutes = require("./routes/salesOrderRoutes");
const dispatchRoutes = require("./routes/dispatchRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "ERP Case Study API is running"
    });
});

app.get("/api/health", async (req, res) => {

    try {

        const result =
            await pool.query("SELECT NOW()");

        res.json({
            status: "success",
            message:
                "Backend and PostgreSQL are connected",
            databaseTime:
                result.rows[0].now
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            status: "error",
            message:
                "Database connection failed"
        });

    }

});

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/enquiries",
    enquiryRoutes
);

app.use(
    "/api/products",
    productRoutes
);

app.use(
    "/api/quotations",
    quotationRoutes
);

app.use(
    "/api/sales-orders",
    salesOrderRoutes
);

app.use(
    "/api/dispatches",
    dispatchRoutes
);

const PORT =
    process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});