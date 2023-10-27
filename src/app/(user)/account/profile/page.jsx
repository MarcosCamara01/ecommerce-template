"use client";

import { FixedComponent } from "@/components/FixedComponent";
import { Loader } from "@/helpers/Loader";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { IoIosArrowForward } from 'react-icons/io';
import { useClientMediaQuery } from '@/hooks/useClientMediaQuery';

const ProfilePage = () => {
  const [toEdit, setToEdit] = useState({ field: 'none', value: 'none' });
  const { data: session, status } = useSession();
  const isMobile = useClientMediaQuery('(max-width: 600px)');

  const warningMessage = "You cannot update the user if you are logged in with Google"

  return (
    <>
      {
        status === "loading" ?
          <Loader />
          :
          status === "authenticated" ?
            <div className="user">
              <div className="user-information">
                <button
                  className="cell-button"
                  onClick={() => session.user.image ?
                    setToEdit({ field: "warning", value: warningMessage })
                    :
                    setToEdit({ field: "name", value: session.user.name })}
                >
                  <div className="cell-left">
                    <h4>Name</h4>
                    <span>{session.user.name}</span>
                  </div>
                  <div className="cell-right">
                    <IoIosArrowForward />
                  </div>
                </button>
                <button
                  className="cell-button"
                  onClick={() => session.user.image ?
                    setToEdit({ field: "warning", value: warningMessage })
                    :
                    setToEdit({ field: "email", value: session.user.email })}
                >
                  <div className="cell-left">
                    <h4>E-MAIL</h4>
                    <span>{session.user.email}</span>
                  </div>
                  <div className="cell-right">
                    <IoIosArrowForward />
                  </div>
                </button>
                <button
                  className="cell-button"
                >
                  <div className="cell-left">
                    <h4>ADDRESSES</h4>
                    {session.user.address && <span>{session.user.address}</span>}
                  </div>
                  <div className="cell-right">
                    <IoIosArrowForward />
                  </div>
                </button>
                <button
                  className="cell-button"
                  onClick={() => session.user.image ?
                    setToEdit({ field: "warning", value: warningMessage })
                    :
                    setToEdit({ field: "phone", value: session.user.phone })}
                >
                  <div className="cell-left">
                    <h4>TELEPHONE</h4>
                    {session.user.phone && <span>{session.user.phone}</span>}
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
            <div><h2>Unregistered user</h2></div>
      }

      {toEdit.field !== "none" && (
        <FixedComponent
          message={toEdit.value}
          task={toEdit.field}
          toEdit={toEdit}
          setToEdit={setToEdit}
          isMobile={isMobile}
        />
      )}
    </>
  );
}

export default ProfilePage;