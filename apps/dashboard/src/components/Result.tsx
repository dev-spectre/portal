import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Turtle } from "lucide-react";

interface Mark {
  id: number;
  registerNumber: string;
  exam: "IA1" | "IA2";
  mark: number;
}

interface MarksTableProps {
  classId: number;
}

export function MarksTable({ classId }: MarksTableProps) {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [editing, setEditing] = useState<boolean>(false);
  const [editedMarks, setEditedMarks] = useState<Mark[]>([]);
  const [students, setStudents] = useState<string[]>([]);

  useEffect(() => {
    const studenetListCache = JSON.parse(localStorage.getItem(`class/${classId}/students`) ?? "[]");
    setStudents(studenetListCache.map((student: any) => student.registerNumber));
    console.log(studenetListCache);
    axios
      .get<{ marks: Mark[] }>(`http://localhost:3000/v1/mark/${classId}`, {
        withCredentials: true,
        validateStatus: () => true,
      })
      .then((response) => {
        setMarks(response.data.marks);
        setEditedMarks(response.data.marks);
      })
      .catch((error) => console.error("Error fetching marks:", error));
  }, [classId]);

  const handleEditClick = () => setEditing(true);

  const handleInputChange = (registerNumber: string, exam: "IA1" | "IA2", value: string) => {
    setEditedMarks((prevMarks) => prevMarks.map((mark) => (mark.registerNumber === registerNumber && mark.exam === exam ? { ...mark, mark: Number(value) } : mark)));
  };

  const handleSubmit = () => {
    // axios
    //   .put("http://localhost:3000/v1/mark/update", { marks: editedMarks })
    //   .then(() => setEditing(false))
    //   .catch((error) => console.error("Error updating marks:", error));
    setEditing(false);
  };

  return (
    <div className="p-4">
      <Table className="mt-4">
        <TableHeader>
          <TableRow className="text-left hover:bg-white/10">
            <TableHead className="text-white">Register Number</TableHead>
            <TableHead className="text-white">IA1</TableHead>
            <TableHead className="text-white">IA2</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((registerNumber) => (
            <TableRow key={registerNumber} className="hover:bg-white/10">
              <TableCell>{registerNumber}</TableCell>
              <TableCell>
                {editing ? (
                  <Input
                    type="text"
                    value={editedMarks.find((m) => m.registerNumber === registerNumber && m.exam === "IA1")?.mark || ""}
                    onChange={(e: any) => handleInputChange(registerNumber, "IA1", e.target.value)}
                  />
                ) : (
                  marks.find((m) => m.registerNumber === registerNumber && m.exam === "IA1")?.mark || ""
                )}
              </TableCell>
              <TableCell>
                {editing ? (
                  <Input
                    type="text"
                    value={editedMarks.find((m) => m.registerNumber === registerNumber && m.exam === "IA2")?.mark || ""}
                    onChange={(e: any) => handleInputChange(registerNumber, "IA2", e.target.value)}
                  />
                ) : (
                  marks.find((m) => m.registerNumber === registerNumber && m.exam === "IA2")?.mark || ""
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!editing && (
        <Button className="w-full mt-4" onClick={handleEditClick}>
          Edit Marks
        </Button>
      )}
      {editing && (
        <Button className="mt-4 w-full" onClick={handleSubmit}>
          Submit
        </Button>
      )}
    </div>
  );
}
