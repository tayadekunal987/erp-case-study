import { useEffect, useState } from "react";
import api from "../api";

function Inventory() {

    const [products, setProducts] =
        useState([]);

    const [error, setError] =
        useState("");

    useEffect(() => {

        const loadInventory = async () => {

            try {

                const response =
                    await api.get("/products");

                setProducts(
                    response.data.products
                );

            } catch (error) {

                setError(
                    error.response?.data?.message ||
                    "Failed to load inventory"
                );

            }
        };

        loadInventory();

    }, []);

    return (
        <div className="page">

            <h1>Inventory</h1>

            {error && (
                <div className="error">
                    {error}
                </div>
            )}

            <div className="table-card">

                <table>

                    <thead>

                        <tr>
                            <th>Code</th>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Unit</th>
                            <th>Physical</th>
                            <th>Reserved</th>
                            <th>Available</th>
                            <th>Base Price</th>
                        </tr>

                    </thead>

                    <tbody>

                        {products.map((product) => (

                            <tr key={product.id}>

                                <td>
                                    {product.product_code}
                                </td>

                                <td>
                                    {product.product_name}
                                </td>

                                <td>
                                    {product.category}
                                </td>

                                <td>
                                    {product.unit}
                                </td>

                                <td>
                                    {product.physical_quantity}
                                </td>

                                <td>
                                    {product.reserved_quantity}
                                </td>

                                <td>
                                    <strong>
                                        {product.available_quantity}
                                    </strong>
                                </td>

                                <td>
                                    ₹
                                    {Number(
                                        product.base_price
                                    ).toFixed(2)}
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
}

export default Inventory;