import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/libs/auth";
import ProductList from "@/components/admin/ProductList";
// import CreateProductButton from "./components/CreateProductButton";
import { getAllProducts } from "./actions";

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  const products = await getAllProducts();

  if (!products) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Error loading products</h1>
      </div>
    );
  }

  const productsJSON = JSON.stringify(products);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products Management</h1>
        {/* <CreateProductButton /> */}
      </div>
      <ProductList initialProducts={productsJSON} />
    </div>
  );
}