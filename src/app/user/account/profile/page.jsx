"use client";

import { FixedComponent } from "@/components/FixedComponent";
import { Loader } from "@/helpers/Loader";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { IoIosArrowForward } from 'react-icons/io';

function ProfilePage() {
  const [toEdit, setToEdit] = useState({ field: 'none', value: '' });
  const { data: session, status } = useSession();
  console.log(session)
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
                  onClick={() => setToEdit({ field: "name", value: session.user.name })}
                  className="cell-button"
                >
                  <div className="cell-left">
                    <h4>NAME</h4>
                    <span>{session.user.name}</span>
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
                <button
                  className="cell-button"
                  onClick={() => setToEdit({ field: "address", value: session.user.address })}
                >
                  <div className="cell-left">
                    <h4>ADDRESSES</h4>
                    <span>{session.user.address}</span>
                  </div>
                  <div className="cell-right">
                    <IoIosArrowForward />
                  </div>
                </button>
                <button
                  className="cell-button"
                  onClick={() => setToEdit({ field: "phone", value: session.user.phone })}
                >
                  <div className="cell-left">
                    <h4>TELEPHONE</h4>
                    <span>{session.user.phone}</span>
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
          message={toEdit.field}
          task="Update"
          toEdit={toEdit}
          setToEdit={setToEdit}
        />
      )}
    </>
  );
}

export default ProfilePage;