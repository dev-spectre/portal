import { fetchClassList } from "@/lib/utils";
import { useEffect, useState } from "react";

export function ClassCard({ id, name }: { id: number; name: string }) {
  return (
    <div key={id} className="border flex justify-between pr-7 items-center border-white/30 rounded-md">
      <a href={`/class/${id}`} className="flex-grow px-5 py-7">
        <h2>{name}</h2>
      </a>
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
        <ClassCard id={classObject.id} name={classObject.name} />
      ))}
    </div>
  );
}
