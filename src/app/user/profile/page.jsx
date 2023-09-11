"use client";
import { useSession, signOut } from "next-auth/react";
import { IoIosArrowForward } from 'react-icons/io';

function ProfilePage() {
  const { data: session, status } = useSession();

  console.log(session, status);

  return (
    <>
      {status === "authenticated" ?
        (<div className="user">
          <h2 className="user-name">{session.user.fullname}</h2>

          <div className="user-information">
            <div className="cell-button">
              <div className="cell-left">
                <span>E-MAIL</span>
                <span>{session.user.email}</span>
              </div>
              <div className="cell-right">
                <IoIosArrowForward />
              </div>
            </div>
            <div className="cell-button">
              <div className="cell-left">
                <span>DIRECCIONES</span>
              </div>
              <div className="cell-right">
                <IoIosArrowForward />
              </div>
            </div>
            <div className="cell-button">
              <div className="cell-left">
                <span>WALLET</span>
              </div>
              <div className="cell-right">
                <IoIosArrowForward />
              </div>
            </div>
            <div className="cell-button">
              <div className="cell-left">
                <span>TELÉFONO</span>
              </div>
              <div className="cell-right">
                <IoIosArrowForward />
              </div>
            </div>
            <div className="cell-button">
              <div className="cell-left">
                <span>CAMBIAR CONTRASEÑA</span>
              </div>
              <div className="cell-right">
                <IoIosArrowForward />
              </div>
            </div>
          </div>

          <button
            className="user-button"
            onClick={() => {
              signOut();
            }}
          >
            Signout
          </button>
        </div>)
        :
        (
          <div><h2>Usuario no registrado</h2></div>
        )
      }

    </>
  );
}

export default ProfilePage;
