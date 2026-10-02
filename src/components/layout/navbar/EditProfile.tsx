"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, type RefObject } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingButton from "@/components/ui/loadingButton";
import type { Manager } from "@/hooks/useManager";
import { useSession } from "@/lib/auth/client";

type UpdateProfileResponse = {
  error?: string;
};

export default function EditProfile({
  manager,
  returnFocusRef,
}: {
  manager: Manager;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);

  // No React Query cache holds the user's name: it lives in the Better Auth
  // session store, and router.refresh() re-renders the server components.
  // react-doctor-disable-next-line react-doctor/query-mutation-missing-invalidation
  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async () => {
      const name = nameRef.current?.value;
      if (name === undefined) {
        throw new Error("Profile form is unavailable");
      }
      const response = await fetch("/api/auth/update-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as UpdateProfileResponse;
        throw new Error(payload.error || "Error updating profile");
      }

      return response.json();
    },
    onSuccess: () => {
      manager.close();
      router.refresh();
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while updating your profile",
      );
    },
  });

  return (
    <Dialog open={manager.active} onOpenChange={manager.set}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          nameRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const returnTarget = returnFocusRef.current;
          returnFocusRef.current = null;
          queueMicrotask(() => {
            if (
              returnTarget?.isConnected &&
              returnTarget.getClientRects().length > 0
            ) {
              returnTarget.focus();
            }
          });
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form
          // Loaded with `dynamic(..., { ssr: false })`: this dialog cannot render
          // without JavaScript, so a server action would not enhance it. The
          // matching react-doctor override lives in doctor.config.json.
          className="flex flex-col gap-3.5"
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile();
          }}
        >
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="name"
                ref={nameRef}
                autoComplete="name"
                defaultValue={session?.user?.name || ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                defaultValue={session?.user?.email || ""}
                disabled
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <LoadingButton type="submit" loading={isPending}>
              Save changes
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
