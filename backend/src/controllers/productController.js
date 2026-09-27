const pool = require("../config/db");

const getProducts = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.id,
                p.product_code,
                p.product_name,
                p.category,
                p.unit,
                p.base_price,
                i.physical_quantity,
                i.reserved_quantity,
                i.available_quantity
            FROM products p
            JOIN inventory i ON p.id = i.product_id
            ORDER BY p.id
        `);

        res.json({
            products: result.rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch products"
        });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                p.id,
                p.product_code,
                p.product_name,
                p.category,
                p.unit,
                p.base_price,
                i.physical_quantity,
                i.reserved_quantity,
                i.available_quantity
            FROM products p
            JOIN inventory i ON p.id = i.product_id
            WHERE p.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch product"
        });
    }
};

module.exports = {
    getProducts,
    getProductById
};