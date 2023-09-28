"use client";

import { FixedComponent } from "@/components/FixedComponent";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { IoIosArrowForward } from 'react-icons/io';

function ProfilePage() {
  const [toEdit, setToEdit] = useState({ field: 'none', value: '' });
  const { data: session, status, update } = useSession();

  const onUpdate = (toUpdate) => {
    if (toEdit.field === "name" || toEdit.field === "email") {
      update({ [toEdit.field]: toUpdate });
      setToEdit({ field: 'none', value: '' });
    }
  };

  return (
    <>
      {status === "authenticated" ?
        <div className="user">
          <div className="user-information">
            <button
              onClick={() => setToEdit({ field: "name", value: session.user.name })}
              className="cell-button"
            >
              <div className="cell-left">
                <h4>NOMBRE</h4>
                <span>{session.user.email}</span>
              </div>
              <div className="cell-right">
                <IoIosArrowForward />
              </div>
            </button>
            <button
              className="cell-button"
              onClick={() => setToEdit({ field: "email", value: session.user.email })}
            >
              <div className="cell-left">
                <h4>E-MAIL</h4>
                <span>{session.user.email}</span>
              </div>
              <div className="cell-right">
                <IoIosArrowForward />
              </div>
            </button>
            <button className="cell-button">
              <div className="cell-left">
                <h4>DIRECCIONES</h4>
              </div>
              <div className="cell-right">
                <IoIosArrowForward />
              </div>
            </button>
            <button className="cell-button">
              <div className="cell-left">
                <h4>TELÉFONO</h4>
              </div>
              <div className="cell-right">
                <IoIosArrowForward />
              </div>
            </button>
          </div>

          <button
            className="user-button"
            onClick={() => {
              signOut();
            }}
          >
            Signout
          </button>
        </div>
        :
        <div><h2>Usuario no registrado</h2></div>
      }

      {toEdit.field !== "none" && (
        <FixedComponent
          message={toEdit.field}
          setToEdit={setToEdit}
          task="Update"
          onUpdate={onUpdate}
          value={toEdit.value}
        />
      )}
    </>
  );
}

export default ProfilePage;