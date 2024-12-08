"use client";

import { useState, useEffect } from "react";
import { ProductFormInput, ProductState, VariantFormInput } from "@/types/types"; // Import the new types
import { useRouter } from "next/router";

interface ProductFormProps {
  initialProduct?: ProductFormInput; // Use ProductFormInput for existing product
  // onSubmit: (product: ProductFormInput) => Promise<void>; // Function to handle form submission
}

const ProductForm = ({ initialProduct }: ProductFormProps) => {
// const ProductForm = ({ initialProduct, onSubmit }: ProductFormProps) => {
  // const router = useRouter();
  const [product, setProduct] = useState<ProductFormInput>({
    name: "",
    description: [""],
    price: 0,
    category: "",
    sizes: [""],
    image: [""],
    variants: [{} as VariantFormInput], // Initialize with an empty variant
    quantity: 0,
    productId: "", // Assuming you will generate this later
    purchased: false,
    state: ProductState.ARCHIVED, // Default state, adjust as necessary
  });

  useEffect(() => {
    if (initialProduct) {
      // Map initialProduct to ProductFormInput
      setProduct({
        ...initialProduct,
        variants: initialProduct.variants.map(variant => ({
          ...variant,
          images: variant.images || [], // Ensure images is an array
        })),
      });
    }
  }, [initialProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: name === "description" ? [value] : value,
    }));
  };

  const handleVariantChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedVariants = [...product.variants];
    updatedVariants[index] = { ...updatedVariants[index], [name]: value };
    setProduct((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const addVariant = () => {
    setProduct((prev) => ({
      ...prev,
      variants: [...prev.variants, { _id: "", name: "", sku: "", stock: 0, color: "", stripePriceId: "", images: [] }],
    }));
  };

  const removeVariant = (index: number) => {
    const updatedVariants = product.variants.filter((_, i) => i !== index);
    setProduct((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // await onSubmit(product);
    // router.push("/admin/products"); // Redirect after submission
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <h2 className="text-lg font-semibold mb-4">{initialProduct ? "Update Product" : "Create New Product"}</h2>
      {/* Product Fields */}
      <div className="mb-4">
        <label className="block mb-1">Name:</label>
        <input
          type="text"
          name="name"
          value={product.name}
          onChange={handleChange}
          className="border rounded px-2 py-1 w-full"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Description:</label>
        <textarea
          name="description"
          value={product.description[0]}
          onChange={handleChange}
          className="border rounded px-2 py-1 w-full"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Price:</label>
        <input
          type="number"
          name="price"
          value={product.price}
          onChange={handleChange}
          className="border rounded px-2 py-1 w-full"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Category:</label>
        <input
          type="text"
          name="category"
          value={product.category}
          onChange={handleChange}
          className="border rounded px-2 py-1 w-full"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Sizes:</label>
        <input
          type="text"
          name="sizes"
          value={product.sizes.join(", ")}
          onChange={(e) => setProduct({ ...product, sizes: e.target.value.split(", ") })}
          className="border rounded px-2 py-1 w-full"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Images (comma-separated URLs):</label>
        <input
          type="text"
          name="image"
          value={product.image.join(", ")}
          onChange={(e) => setProduct({ ...product, image: e.target.value.split(", ") })}
          className="border rounded px-2 py-1 w-full"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Quantity:</label>
        <input
          type="number"
          name="quantity"
          value={product.quantity}
          onChange={handleChange}
          className="border rounded px-2 py-1 w-full"
          required
        />
      </div>

      {/* Variants Section */}
      <h3 className="text-lg font-semibold mb-2">Variants</h3>
      {product.variants.map((variant, index) => (
        <div key={index} className="border p-2 mb-2 rounded">
          <div className="mb-2">
            <label className="block mb-1">Variant Name:</label>
            <input
              type="text"
              name="name"
              value={variant.name}
              onChange={(e) => handleVariantChange(index, e)}
              className="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1">SKU:</label>
            <input
              type="text"
              name="sku"
              value={variant.sku}
              onChange={(e) => handleVariantChange(index, e)}
              className="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Stock:</label>
            <input
              type="number"
              name="stock"
              value={variant.stock}
              onChange={(e) => handleVariantChange(index, e)}
              className="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1">Color:</label>
            <input
              type="text"
              name="color"
              value={variant.color}
              onChange={(e) => handleVariantChange(index, e)}
              className="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <button type="button" onClick={() => removeVariant(index)} className="text-red-500">
            Remove Variant
          </button>
        </div>
      ))}
      <button type="button" onClick={addVariant} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors mb-4">
        Add Variant
      </button>

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
        {initialProduct ? "Update Product" : "Create Product"}
      </button>
    </form>
  );
};

export default ProductForm;