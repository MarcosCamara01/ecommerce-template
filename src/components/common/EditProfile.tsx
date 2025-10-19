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
import { useUser } from "@/hooks/useUser";
import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useRef } from "react";
import { toast } from "sonner";
/** TYPES */
import type { Manager } from "@/hooks/useManager";

export default function EditProfile({ manager }: { manager: Manager }) {
  const { user: currentUser } = useUser();

  const nameRef = useRef<HTMLInputElement>(null!);
  const phoneRef = useRef<HTMLInputElement>(null!);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          name: nameRef.current.value,
          phone: phoneRef.current.value,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
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
              defaultValue={currentUser?.user_metadata?.name || ""}
              className="col-span-3"
            />
          </div>
          <div className="grid items-center grid-cols-4 gap-4">
            <Label htmlFor="Email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              defaultValue={currentUser?.email || ""}
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
              defaultValue={currentUser?.user_metadata?.phone || ""}
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
