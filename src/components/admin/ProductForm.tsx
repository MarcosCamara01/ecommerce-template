"use client";

import { useState, useRef } from "react";
import { useProductMutation } from "@/hooks/product/mutations/useProductMutation";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/ui/loadingButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FiArchive, FiCheck, FiX, FiPackage, FiImage, FiLayers } from "react-icons/fi";
import { BasicInfo, type BasicInfoRef } from "./BasicInfo";
import { MainImage, type MainImageRef } from "./MainImage";
import { VariantsSection, type VariantsSectionRef } from "./VariantsSection";
import type { ProductWithVariants } from "@/lib/db/drizzle/schema";
import type { ProductFormData } from "@/types/admin";
import { useCatalogCreateCommand } from "@/hooks/product/useCatalogCreateCommand";
import { encodeProductFormData } from "./product-form-data";

export type { ProductFormData };

interface FormState {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  accepted?: boolean;
  operationId?: string;
}

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: ProductFormData;
  restoreArchived?: boolean;
  onSuccess?: (product: ProductWithVariants) => void;
}

export function ProductForm({
  mode,
  initialData,
  restoreArchived = false,
  onSuccess,
}: ProductFormProps) {
  const { createAsync, updateAsync, isPending, isUpdatePending } =
    useProductMutation();
  const createCommand = useCatalogCreateCommand();
  const [state, setState] = useState<FormState>({
    success: false,
    message: "",
    errors: undefined,
  });

  const basicInfoRef = useRef<BasicInfoRef>(null!);
  const mainImageRef = useRef<MainImageRef>(null!);
  const variantsSectionRef = useRef<VariantsSectionRef>(null!);
  const isLoading = mode === "create" ? isPending : isUpdatePending;

  const clearFieldError = (field: string) => {
    setState((current) => {
      if (!current.errors?.[field]) return current;
      const errors = { ...current.errors };
      delete errors[field];
      const hasErrors = Object.keys(errors).length > 0;
      return {
        ...current,
        errors: hasErrors ? errors : undefined,
        message: hasErrors ? current.message : "",
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const basicInfo = {
        name: basicInfoRef.current.name,
        description: basicInfoRef.current.description,
        price: basicInfoRef.current.price,
        category: basicInfoRef.current.category,
      };
      const mainImage =
        mainImageRef.current.hasNewImage && mainImageRef.current.file
          ? mainImageRef.current.file
          : null;
      const variantsData = variantsSectionRef.current.getVariants();
      const imagesData = variantsSectionRef.current.getImages();
      const variantsForSubmit = variantsData.map((variant) => ({
        id: variant.id,
        color: variant.color,
        sizes: variant.sizes,
        imageCount: variant.imageCount,
        existingImages: variant.existingImages,
        removedImages: variant.removedImages,
      }));

      const commandId = mode === "create"
        ? await createCommand.prepare({
            basicInfo,
            mainImage,
            variants: variantsForSubmit,
            images: imagesData,
          })
        : undefined;
      const formData = encodeProductFormData({
        mode,
        productId: initialData?.id,
        restoreArchived,
        commandId,
        basicInfo,
        mainImage,
        existingMainImage: mainImageRef.current.existingUrl,
        variants: variantsForSubmit,
        images: imagesData,
      });

      const result =
        mode === "create"
          ? await createAsync(formData)
          : await updateAsync(formData);

      setState({
        success: result.success,
        message: result.message,
        errors: result.errors,
        accepted: result.accepted,
        operationId: result.operationId,
      });

      if (
        mode === "create" &&
        result.success &&
        !result.accepted
      ) {
        createCommand.clear();
      }
      if (result.success && result.data && onSuccess) {
        onSuccess(result.data);
      }
    } catch (error) {
      setState({
        success: false,
        message: "An unexpected error occurred",
        errors: undefined,
        operationId: createCommand.getCurrentId(),
      });
    }
  };

  const handleReset = () => {
    basicInfoRef.current.reset();
    mainImageRef.current.reset();
    variantsSectionRef.current.reset();
    if (mode === "create") createCommand.clear();
    setState({ success: false, message: "", errors: undefined });
  };

  const title = mode === "create" ? "Create Product" : "Edit Product";
  const subtitle =
    mode === "create"
      ? "Add a new product with variants and images to your store"
      : restoreArchived
        ? "Review this archived product and explicitly restore it to the storefront"
        : "Update product information, variants and images";
  const submitButtonText =
    mode === "create"
      ? "Create Product"
      : restoreArchived ? "Restore Product" : "Update Product";

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto p-6 md:p-8 space-y-6"
    >
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-color-primary">
          {title}
        </h1>
        <p className="text-color-tertiary">{subtitle}</p>
      </div>

      <Separator />

      {restoreArchived && (
        <Alert>
          <FiArchive className="h-4 w-4" />
          <AlertTitle>Archived Product</AlertTitle>
          <AlertDescription>
            Saving this form is an explicit restore action and will republish the durable product identity after catalog synchronization succeeds.
          </AlertDescription>
        </Alert>
      )}

      {/* Alert Message */}
      {state.message && (
        <Alert variant={state.success ? "success" : "destructive"}>
          {state.success ? (
            <FiCheck className="h-4 w-4" />
          ) : (
            <FiX className="h-4 w-4" />
          )}
          <AlertTitle>
            {state.success
              ? state.accepted
                ? "Synchronization pending"
                : "Success"
              : "Error"}
          </AlertTitle>
          <AlertDescription>
            {state.message}
            {state.operationId && (
              <span className="mt-2 block font-mono text-xs">
                Operation: {state.operationId}
              </span>
            )}
          </AlertDescription>
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
          <BasicInfo
            ref={basicInfoRef}
            errors={state.errors}
            initialData={initialData?.basicInfo}
            onFieldChange={clearFieldError}
          />
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
          <MainImage
            ref={mainImageRef}
            errors={state.errors}
            initialImageUrl={initialData?.mainImageUrl}
            onFieldChange={clearFieldError}
          />
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
          <VariantsSection
            ref={variantsSectionRef}
            initialVariants={initialData?.variants}
            errors={state.errors}
            onFieldChange={clearFieldError}
          />
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
              {mode === "create" ? "Clear Form" : "Reset Changes"}
            </Button>
            <LoadingButton
              loading={isLoading}
              className="flex-1 bg-white text-black hover:bg-white/90"
              size="lg"
              icon={<FiCheck className="h-4 w-4" />}
              iconPosition="left"
            >
              {submitButtonText}
            </LoadingButton>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
