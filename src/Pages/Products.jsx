import React from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';

const Products = () => {
  const context = useAppContext();

  const products = context.productContext.products;
  const handleDelete = context.productContext.delete;
console.log(products)
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Products</h1>

      {/* Add Product Button */}
      <Link to="/inventory/addProduct">
        <button className="btn btn-primary mb-4">Add Product</button>
      </Link>

      {/* Responsive Product List Table */}
      <div className="overflow-x-auto">
        <table className="table w-full table-auto border-collapse">
          <thead>
            <tr className="text-left">
              <th className="p-2 border-b">Product Name</th>
              <th className="p-2 border-b">Image</th>
              <th className="p-2 border-b">Stock</th>
              <th className="p-2 border-b">Purchase Price</th>
              <th className="p-2 border-b">Sell Price</th>
              <th className="p-2 border-b">Retail Price</th>
              <th className="p-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products && products.map((product , index) => (
              <tr key={product.id} className="hover:bg-gray-100">
                <td className="p-2 border-b">{product.productName}</td>
                <td className="p-2 border-b">
                  {product.productImage ? (
                    <img src={product.productImage} alt={product.productName} className="w-10 h-10 object-cover" />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-200">
                      <span className="text-gray-500">🛒</span>
                    </div>
                  )}
                </td>
                <td className="p-2 border-b">
                  {product.quantity > 0 ? product.quantity : <span className="text-red-500">Out of Stock</span>}
                </td>
                <td className="p-2 border-b">
                  {product.purchasePrice ? `$${product.purchasePrice.toFixed(2)}` : <span className="text-gray-500">Not Available</span>}
                </td>
                <td className="p-2 border-b">
                  {product.sellPrice ? `$${product.sellPrice.toFixed(2)}` : <span className="text-gray-500">Not Available</span>}
                </td>
                <td className="p-2 border-b">
                  {product.retailPrice ? `$${product.retailPrice.toFixed(2)}` : <span className="text-gray-500">Not Available</span>}
                </td>
                <td className="p-2 border-b">
                  <Link to={`/inventory/edit-product/${product.id}`}>
                    <button className="btn btn-warning mr-2">
                      <FaEdit />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="btn btn-danger"
                  >
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;