import { useMutation } from "@tanstack/react-query";
import { createProduct } from "./productMutations";

export const useProductMutation = () => {
  const create = useMutation({
    mutationFn: createProduct,
    onError: (error) => {
      console.error("Error al crear el producto:", error);
    },
  });

  return {
    create: create.mutate,
    createAsync: create.mutateAsync,
    isPending: create.isPending,
    isError: create.isError,
    isSuccess: create.isSuccess,
    error: create.error,
  };
};
