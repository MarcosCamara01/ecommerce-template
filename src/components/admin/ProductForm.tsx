"use client";

import { useState, useRef } from "react";
import { useProductMutation } from "@/hooks/product/mutations/useProductMutation";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/ui/loadingButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FiArchive, FiCheck, FiX } from "react-icons/fi";
import { BasicInfo, type BasicInfoRef } from "./BasicInfo";
import { MainImage, type MainImageRef } from "./MainImage";
import { VariantsSection, type VariantsSectionRef } from "./VariantsSection";
import type { ProductWithVariants } from "@/lib/db/drizzle/schema";
import type { ProductFormData } from "@/types/admin";
import { useCatalogCreateCommand } from "@/hooks/product/useCatalogCreateCommand";
import { encodeProductFormData } from "./product-form-data";
import { readImagePreview } from "./image-preview";
import { StorefrontPreview, type PreviewValues } from "./StorefrontPreview";
import { catalogImageBatchErrors } from "@/lib/catalog-sync/image-file-contract";

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
  /** Rendered under the variants, e.g. the archive control. */
  footer?: React.ReactNode;
}

export function ProductForm({
  mode,
  initialData,
  restoreArchived = false,
  onSuccess,
  footer,
}: ProductFormProps) {
  const { createAsync, updateAsync, isPending, isUpdatePending } =
    useProductMutation();
  const createCommand = useCatalogCreateCommand();
  const [state, setState] = useState<FormState>({
    success: false,
    message: "",
    errors: undefined,
  });

  const initialPreview: PreviewValues = {
    name: initialData?.basicInfo.name ?? "",
    price: initialData?.basicInfo.price ? String(initialData.basicInfo.price) : "",
    color: initialData?.variants[0]?.color ?? "",
    image: initialData?.mainImageUrl ?? null,
  };
  const [preview, setPreview] = useState<PreviewValues>(initialPreview);

  // The form's fields own their values; the preview reads them as they change.
  const readPreview = (form: HTMLFormElement, target: EventTarget) => {
    const field = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "";
    const picked =
      target instanceof HTMLInputElement &&
      target.name === "mainImagePicker" &&
      target.files?.[0];
    setPreview((current) => ({
      ...current,
      name: field("name"),
      price: field("price"),
      color: (form.querySelector<HTMLInputElement>("#color-0")?.value ?? "").trim(),
    }));
    if (picked) {
      // Same data-URL preview the main image picker uses.
      void readImagePreview(picked)
        .then((image) => setPreview((current) => ({ ...current, image })))
        .catch(() => {});
    }
  };

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
      const [imageBatchError] = catalogImageBatchErrors([
        ...(mainImage ? [mainImage] : []),
        ...Object.values(imagesData).flat(),
      ]);
      if (imageBatchError) {
        setState({
          success: false,
          message: imageBatchError,
          errors: { images: [imageBatchError] },
        });
        return;
      }

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
    setPreview(initialPreview);
    if (mode === "create") createCommand.clear();
    setState({ success: false, message: "", errors: undefined });
  };

  const title = mode === "create" ? "New product" : "Edit product";
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

  const section = "flex flex-col gap-3.5 rounded-photo-lg border border-line bg-fg/5 p-[22px]";

  return (
    <form
      onSubmit={handleSubmit}
      onInput={(event) => readPreview(event.currentTarget, event.target)}
      onChange={(event) => readPreview(event.currentTarget, event.target)}
      className="flex flex-col gap-6 pb-24"
    >
      <div className="flex flex-col gap-2.5 pt-6 lg:pt-10">
        <h1 className="font-display text-[64px] leading-[0.82] lg:text-[min(160px,11vw)]">
          {title}
        </h1>
        <p className="text-muted">{subtitle}</p>
      </div>

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

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4">
          <section aria-labelledby="basic-info-title" className={section}>
            <h2 id="basic-info-title" className="text-lg font-semibold">
              Basic Information
            </h2>
            <BasicInfo
              ref={basicInfoRef}
              errors={state.errors}
              initialData={initialData?.basicInfo}
              onFieldChange={clearFieldError}
            />
          </section>

          <section aria-labelledby="main-image-title" className={section}>
            <h2 id="main-image-title" className="text-lg font-semibold">
              Main Image
            </h2>
            <MainImage
              ref={mainImageRef}
              errors={state.errors}
              initialImageUrl={initialData?.mainImageUrl}
              onFieldChange={clearFieldError}
            />
          </section>

          <section aria-labelledby="variants-title" className={section}>
            <h2 id="variants-title" className="text-lg font-semibold">
              Product Variants
            </h2>
            <VariantsSection
              ref={variantsSectionRef}
              initialVariants={initialData?.variants}
              errors={state.errors}
              onFieldChange={clearFieldError}
            />
          </section>

          {footer}
        </div>

        <aside className="flex flex-col gap-3.5 max-lg:order-first lg:sticky lg:top-[88px]">
          <StorefrontPreview values={preview} />
          <LoadingButton loading={isLoading} className="w-full text-base">
            {submitButtonText}
          </LoadingButton>
          <Button
            type="reset"
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {mode === "create" ? "Clear Form" : "Reset Changes"}
          </Button>
        </aside>
      </div>
    </form>
  );
}
