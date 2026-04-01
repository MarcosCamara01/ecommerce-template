"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";

import {
  Dialog,
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

export default function EditProfile({ manager }: { manager: Manager }) {
  const { data: session } = useSession();
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null!);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/update-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nameRef.current.value,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile();
          }}
        >
          <div className="grid gap-4 py-4">
            <div className="grid items-center grid-cols-4 gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                ref={nameRef}
                defaultValue={session?.user?.name || ""}
                className="col-span-3"
              />
            </div>
            <div className="grid items-center grid-cols-4 gap-4">
              <Label htmlFor="Email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                defaultValue={session?.user?.email || ""}
                disabled
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <LoadingButton
              type="submit"
              loading={isPending}
              className="h-[40px] min-w-[160px] max-w-[160px] px-[10px] text-sm"
            >
              Save changes
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
