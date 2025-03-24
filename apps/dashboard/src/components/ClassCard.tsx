import { fetchClassList } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import axios from "axios";
import { backendUrl, STATUS_CODES } from "@/lib/constants";

export function ClassCard({
  id,
  name,
  classList,
  setClassList,
}: {
  id: number;
  name: string;
  classList: {
    id: number;
    name: string;
  }[];
  setClassList: React.Dispatch<
    React.SetStateAction<
      {
        id: number;
        name: string;
      }[]
    >
  >;
}) {
  return (
    <div key={id} className="border flex justify-between pr-7 items-center border-white/30 rounded-md">
      <a href={`/class/${id}`} className="flex-grow px-5 py-7">
        <h2>{name}</h2>
      </a>
      <Button
        onClick={async () => {
          const updatedclassList = classList.filter((classobject) => classobject.id !== id);
          setClassList(updatedclassList);
          const res = await axios.delete(`${backendUrl}/class/${id}`, {
            withCredentials: true,
            validateStatus: () => true,
          });

          if (res.status === STATUS_CODES.SERVICE_UNVAILABLE) {
            const classListCache = JSON.parse(localStorage.getItem("classList") ?? "[]");
            setClassList(classListCache);
          } else if ((res.status = STATUS_CODES.OK)) {
            localStorage.setItem("classList", JSON.stringify(updatedclassList));
          }
        }}>
        Delete
      </Button>
    </div>
  );
}

export function ClassCardContainer() {
  const [classList, setClassList] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const classListCache = JSON.parse(localStorage.getItem("classList") ?? "[]");
    setClassList(classListCache);
    fetchClassList(setClassList);
  }, []);

  return (
    <div className="space-y-5">
      {classList.map((classObject) => (
        <ClassCard id={classObject.id} name={classObject.name} classList={classList} setClassList={setClassList} />
      ))}
    </div>
  );
}
