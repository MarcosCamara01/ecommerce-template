import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserDocument } from "@/types/types";
import { useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useMutation } from "@tanstack/react-query";
import LoadingButton from "../ui/loadingButton";
import { supabase } from "@/libs/supabase";

export default function EditProfile() {
  const { user: currentUser } = useUser();

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: nameRef.current?.value,
          phone: phoneRef.current?.value,
        },
      });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success("Perfil actualizado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Editar perfil</DialogTitle>
        <DialogDescription>
          Realiza cambios en tu perfil aquí. Haz clic en guardar cuando hayas
          terminado.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid items-center grid-cols-4 gap-4">
          <Label htmlFor="name" className="text-right">
            Nombre
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
            Teléfono
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
          Guardar cambios
        </LoadingButton>
      </DialogFooter>
    </DialogContent>
  );
}
