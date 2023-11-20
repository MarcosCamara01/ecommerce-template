"use client";

import { FixedComponent } from "@/components/FixedComponent";
import { Loader } from "@/helpers/Loader";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { IoIosArrowForward } from 'react-icons/io';
import { useClientMediaQuery } from '@/hooks/useClientMediaQuery';

const ProfilePage = () => {
  const [toEdit, setToEdit] = useState({ field: 'none', value: 'none' });
  const { data: session, status } = useSession();
  const isMobile = useClientMediaQuery('(max-width: 600px)');

  const warningMessage = "You cannot update the user if you are logged in with Google";

  const cellButtonStyles = "flex justify-between items-center rounded p-2.5 transition duration-150 ease hover:bg-color-secondary";
  const cellLeftStyles = "flex justify-between flex-col items-start gap-1 text-sm";
  const spanLeftStyles = "text-color-tertiary text-13 mt-1";
  const svgStyles = "text-xl";

  useEffect(() => {
    document.title = "Profile | Ecommerce Template"
  }, [])

  return (
    <>
      {
        status === "loading" ?
          <Loader />
          :
          status === "authenticated" ?
            <div className="pt-12">
              <div className="max-w-screen-md	p-3.5	flex justify-between flex-col border border-solid border-border-primary rounded gap-5	bg-background-secondary">
                <button
                  className={cellButtonStyles}
                  onClick={() => session.user.image ?
                    setToEdit({ field: "warning", value: warningMessage })
                    :
                    setToEdit({ field: "name", value: session.user.name })}
                >
                  <div className={cellLeftStyles}>
                    <h4>Name</h4>
                    <span className={spanLeftStyles}>{session.user.name}</span>
                  </div>
                  <div>
                    <IoIosArrowForward className={svgStyles} />
                  </div>
                </button>
                <button
                  className={cellButtonStyles}
                  onClick={() => session.user.image ?
                    setToEdit({ field: "warning", value: warningMessage })
                    :
                    setToEdit({ field: "email", value: session.user.email })}
                >
                  <div className={cellLeftStyles}>
                    <h4>E-mail</h4>
                    <span className={spanLeftStyles}>{session.user.email}</span>
                  </div>
                  <div>
                    <IoIosArrowForward className={svgStyles} />
                  </div>
                </button>
                <button
                  className={cellButtonStyles}
                >
                  <div className={cellLeftStyles}>
                    <h4>Addresses</h4>
                    {session.user.address && <span className={spanLeftStyles}>{session.user.address}</span>}
                  </div>
                  <div>
                    <IoIosArrowForward className={svgStyles} />
                  </div>
                </button>
                <button
                  className={cellButtonStyles}
                  onClick={() => session.user.image ?
                    setToEdit({ field: "warning", value: warningMessage })
                    :
                    setToEdit({ field: "phone", value: session.user.phone })}
                >
                  <div className={cellLeftStyles}>
                    <h4>Telephone</h4>
                    {session.user.phone && <span className={spanLeftStyles}>{session.user.phone}</span>}
                  </div>
                  <div>
                    <IoIosArrowForward className={svgStyles} />
                  </div>
                </button>
              </div>

              <button
                className="text-sm text-999 mt-7 transition duration-150 ease hover:text-white"
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