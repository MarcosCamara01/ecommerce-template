"use client";

import { useState, useRef } from "react";
import { useProductMutation } from "@/hooks/product/mutations/useProductMutation";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/ui/loadingButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FiCheck, FiX, FiPackage, FiImage, FiLayers } from "react-icons/fi";
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
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-color-primary">Create Product</h1>
        <p className="text-color-tertiary">
          Add a new product with variants and images to your store
        </p>
      </div>

      <Separator />

      {/* Alert Message */}
      {state.message && (
        <Alert variant={state.success ? "success" : "destructive"}>
          {state.success ? (
            <FiCheck className="h-4 w-4" />
          ) : (
            <FiX className="h-4 w-4" />
          )}
          <AlertTitle>{state.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10">
              <FiPackage className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>
                Product name, description, price and category
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BasicInfo ref={basicInfoRef} errors={state.errors} />
        </CardContent>
      </Card>

      {/* Main Image Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10">
              <FiImage className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Main Image</CardTitle>
              <CardDescription>
                Primary product image displayed in listings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MainImage ref={mainImageRef} errors={state.errors} />
        </CardContent>
      </Card>

      {/* Variants Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10">
              <FiLayers className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Product Variants</CardTitle>
              <CardDescription>
                Add color variations with sizes and images
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <VariantsSection ref={variantsSectionRef} />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="reset"
              onClick={handleReset}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <FiX className="mr-2 h-4 w-4" />
              Clear Form
            </Button>
            <LoadingButton 
              loading={isPending} 
              className="flex-1 bg-white text-black hover:bg-white/90" 
              size="lg"
            >
              <FiCheck className="mr-2 h-4 w-4" />
              Create Product
            </LoadingButton>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
