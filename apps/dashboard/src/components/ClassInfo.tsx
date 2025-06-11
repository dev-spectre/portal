import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import axios from "axios";
import { backendUrl, STATUS_CODES } from "@/lib/constants";
import { Card, CardContent } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { getLocalISODate } from "@/lib/utils";

type Student = {
  id: number;
  registerNumber: string;
  isIncharge: boolean;
};

type AttendanceMode = {
  classId: number;
  date: string;
  isPresent: boolean;
  id: number;
  Attendance: {
    student: {
      id: number;
      isIncharge: boolean;
      registerNumber: string;
    };
  }[];
};

export function ClassInfo({ classId }: { classId: number }) {
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceMode[]>([]);

  const [classObject, setClassObject] = useState<{
    id: number;
    name: string;
  }>();

  useEffect(() => {
    const classList: { id: number; name: string }[] = JSON.parse(localStorage.getItem("classList") ?? "[]");
    const classObject = classList.find((classObject) => classObject.id == classId);
    if (classObject) setClassObject(classObject);

    const studenetListCache = JSON.parse(localStorage.getItem(`class/${classId}/students`) ?? "[]");
    setStudentList(studenetListCache);

    const attendanceCache = JSON.parse(localStorage.getItem(`class/${classId}/attendance`) ?? "[]");
    setAttendance(attendanceCache);

    (async function fetchClassStudents() {
      const res = await axios.get(`${backendUrl}/class/${classId}/student/`, {
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.status === STATUS_CODES.OK) {
        localStorage.setItem(`class/${classId}/students`, JSON.stringify(res.data.classMembers));
        setStudentList(res.data.classMembers);
      }
    })();

    (async function fetchAttendance() {
      const res = await axios.get(`${backendUrl}/class/${classId}/attendance/`, {
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.status === STATUS_CODES.OK) {
        localStorage.setItem(`class/${classId}/attendance`, JSON.stringify(res.data.classes));
        setAttendance(res.data.classes);
      }
    })();
  }, []);

  return (
    <div className="space-y-5">
      <div className="border border-white/30 rounded-lg px-5 py-7">
        <h1 className="text-lg font-bold">{classObject?.name}</h1>
        <div className="flex mt-5 justify-between flex-wrap items-center">
          <p>
            <span>Class strength:</span> <span>{studentList.length}</span>
          </p>
          <a href={`/class/${classId}/students`}>
            <Button>Add Students</Button>
          </a>
        </div>
        <div className="flex mt-5 justify-between flex-wrap items-center">
          <p>
            <span>Hours taken:</span> <span>{attendance.length}</span>
          </p>
          <a href={`/class/${classId}/attendance`}>
            <Button>Manage attendance</Button>
          </a>
        </div>
      </div>
      <a href={`/class/${classId}/result`} className="block">
        <Button className="w-full">Manage results</Button>
      </a>
      <TakeAttendance {...{ classId, studentList, setAttendance, attendance }} />
    </div>
  );
}

type AttendancProps = {
  classId: number;
  studentList: Student[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceMode[]>>;
  attendance: AttendanceMode[];
};

export default function TakeAttendance({ classId, studentList, setAttendance, attendance }: AttendancProps) {
  const [attendanceRecord, setAttendanceRecord] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [date, setDate] = useState<string>(getLocalISODate(new Date()));

  const handleAttendanceChange = (studentId: number) => {
    setAttendanceRecord((prev) => (console.log({ ...prev, [studentId]: !prev[studentId] }), { ...prev, [studentId]: !prev[studentId] }));
  };

  const submitAttendance = async () => {
    setError(null);
    setSuccess(null);

    const presentStudents = Object.keys(attendanceRecord)
      .filter((id) => attendanceRecord[Number(id)])
      .map(Number);
    const absentStudents = studentList.map((s: Student) => s.id).filter((id) => !presentStudents.includes(id));

    const isPresent = presentStudents.length < absentStudents.length;
    const selectedStudents = isPresent ? presentStudents : absentStudents;
    try {
      const attendancePayload = { classId, date: new Date(date).toISOString(), isPresent, studentId: selectedStudents };
      const response = await axios.post(`${backendUrl}/class/attendance/`, attendancePayload, { withCredentials: true, validateStatus: () => true });

      if (response.status === STATUS_CODES.CREATED) {
        setSuccess("Attendance recorded successfully!");
        setAttendance([
          ...attendance,
          {
            id: response.data.attendanceModeId,
            classId: attendancePayload.classId,
            date: attendancePayload.date,
            isPresent: attendancePayload.isPresent,
            Attendance: attendancePayload.studentId.map((studentId) => {
              return {
                student: studentList.find((student) => student.id === studentId) || {
                  id: studentId,
                  isIncharge: false,
                  registerNumber: "UNKNOWN",
                },
              };
            }),
          },
        ]);
      } else if (response.status === STATUS_CODES.SERVICE_UNVAILABLE) {
        setError("Service unavailable. Try again later.");
      } else {
        setError("Something went wrong.");
      }
    } catch (err) {
      setError("Failed to connect to server.");
    }
  };

  return (
    <Card className="border bg-black text-white border-white/30 rounded-lg p-4 w-full">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Take Attendance</h2>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-white/30 w-full mb-4" />
        <div className="space-y-2">
          {studentList.map((student: Student) => (
            <div key={student.id} className="flex items-center gap-2">
              <Checkbox id={student.id.toString()} checked={attendanceRecord[student.id] || false} onCheckedChange={() => handleAttendanceChange(student.id)} />
              <label htmlFor={student.id.toString()}>{student.registerNumber}</label>
            </div>
          ))}
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
        <Button onClick={submitAttendance} className="w-full mt-4">
          Submit Attendance
        </Button>
      </CardContent>
    </Card>
  );
}
