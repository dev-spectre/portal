import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { backendUrl, STATUS_CODES } from "./constants";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function fetchClassList(
  setClassList: React.Dispatch<
    React.SetStateAction<
      {
        id: number;
        name: string;
      }[]
    >
  >
) {
  const res = await axios.get(`${backendUrl}/student/class/`, {
    withCredentials: true,
    validateStatus: () => true,
  });

  if (res.status === STATUS_CODES.OK) {
    setClassList(res.data.class);
    localStorage.setItem("classList", JSON.stringify(res.data.class));
  } else if (res.status === STATUS_CODES.UNAUTHORIZED) {
    localStorage.clear();
    window.location.href = "/signin";
  }
}

export function getLocalISODate(date: Date) {
  const localDate = new Date(date);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().split("T")[0];
}

export function formatDate(date: Date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day.toString().padStart(2, "0")}-${month.toString().padStart(2, "0")}-${year}`;
}
