"use client";

import { useState, useRef } from "react";
import { useProductMutation } from "@/hooks/product/mutations/useProductMutation";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/ui/loadingButton";
import { FiCheck, FiX } from "react-icons/fi";
import { BasicInfo, type BasicInfoRef } from "./BasicInfo";
import { MainImage, type MainImageRef } from "./MainImage";
import { VariantsSection, type VariantsSectionRef } from "./VariantsSection";

export function CreateProductForm() {
  const { createAsync, isPending } = useProductMutation();
  const [state, setState] = useState({
    success: false,
    message: "",
    errors: undefined as Record<string, string[]> | undefined,
  });

  const basicInfoRef = useRef<BasicInfoRef>(null!);
  const mainImageRef = useRef<MainImageRef>(null!);
  const variantsSectionRef = useRef<VariantsSectionRef>(null!);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", basicInfoRef.current.name);
    formData.append("description", basicInfoRef.current.description);
    formData.append("price", basicInfoRef.current.price);
    formData.append("category", basicInfoRef.current.category);

    if (mainImageRef.current.file) {
      formData.append("mainImage", mainImageRef.current.file);
    }

    const variantsData = variantsSectionRef.current.getVariants();
    const imagesData = variantsSectionRef.current.getImages();

    variantsData.forEach((variant, index) => {
      const variantImages = imagesData[`variant_${index}`] || [];
      variantImages.forEach((image, imgIndex) => {
        formData.append(`variant_${index}_image_${imgIndex}`, image);
      });
      formData.append(
        `variant_${index}_imageCount`,
        variantImages.length.toString()
      );
    });

    formData.append("variants", JSON.stringify(variantsData));

    const result = await createAsync(formData);
    setState({
      success: result.success,
      message: result.message,
      errors: result.errors,
    });
  };

  const handleReset = () => {
    basicInfoRef.current.reset();
    mainImageRef.current.reset();
    variantsSectionRef.current.reset();
    setState({ success: false, message: "", errors: undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-8 space-y-8">
      <div className="space-y-2 border-b border-border-primary pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
        <p className="text-sm text-color-tertiary">
          Add a new product with variants and images
        </p>
      </div>

      {state.message && (
        <div
          className={`p-4 rounded-lg text-sm font-medium flex items-start gap-3 ${
            state.success
              ? "bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100"
              : "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100"
          }`}
        >
          {state.success ? (
            <FiCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <FiX className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <span>{state.message}</span>
        </div>
      )}

      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          <BasicInfo ref={basicInfoRef} errors={state.errors} />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Product Image</h2>
          <MainImage ref={mainImageRef} errors={state.errors} />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Product Variants</h2>
          <VariantsSection ref={variantsSectionRef} />
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-border-primary">
        <Button
          type="reset"
          onClick={handleReset}
          variant="outline"
          className="flex-1"
        >
          Clear
        </Button>
        <LoadingButton loading={isPending} className="flex-1" variant="outline">
          Create Product
        </LoadingButton>
      </div>
    </form>
  );
}
