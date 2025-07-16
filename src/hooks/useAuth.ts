// hooks/useAuth.ts

import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const navigate = useNavigate()
  const [searchParams] = useSearchParams();

  const getSession = async () => {
    try {
      const code = searchParams.get("code");
      if (code) {
        const { data } = await axios.post(`${import.meta.env.VITE_SERVER_URL}/user/google?code=${code}`)
        return createSession(data)
      }
      // @ts-ignore
      const token = await cookieStore.get({ name: "token" }) ?? sessionStorage.getItem("token");
      if (token) {
        const { data } = await axios.post(`${import.meta.env.VITE_SERVER_URL}/user/info`, { token })
        createSession(data)
      }
      navigate("/clients")
    } catch (e) {
      navigate("/clients")
      console.error("Error obteniendo datos del usuario", e)
    }
  }

  const createSession = async (userInfo: any) => {
    sessionStorage.setItem("token", userInfo.token)
    // @ts-ignore
    await cookieStore.set("token", userInfo.token)
    setUser(userInfo)
  }

  useEffect(() => {
    getSession()
  }, []);




  return { user, loginWithGoogle };
}

export const loginWithGoogle = () => {
  const redirectUri = `${import.meta.env.VITE_BASE_URL}/clients`; // Cambia a tu dominio
  const scope = encodeURIComponent('openid email profile');
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&prompt=select_account`;
  window.location.href = url;
};