/** COMPONENTS */
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
/** FUNCTIONALITY */
import { useSession } from "@/libs/auth/client";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/libs/auth/client";
import { useRef } from "react";
import { toast } from "sonner";
/** TYPES */
import type { Manager } from "@/hooks/useManager";

export default function EditProfile({ manager }: { manager: Manager }) {
  const { data: session } = useSession();

  const nameRef = useRef<HTMLInputElement>(null!);
  const phoneRef = useRef<HTMLInputElement>(null!);

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
        const error = await response.json();
        throw new Error(error.message || "Error updating profile");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      // Refrescar la página para actualizar los datos del usuario
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(
        error.message || "An error occurred while updating your profile"
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
              disabled={true}
              className="col-span-3"
            />
          </div>
          <div className="grid items-center grid-cols-4 gap-4">
            <Label htmlFor="Phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              ref={phoneRef}
              defaultValue=""
              placeholder="No disponible con Better Auth"
              disabled={true}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <LoadingButton
            onClick={() => updateProfile()}
            loading={isPending}
            className="text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px]"
          >
            Save changes
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
