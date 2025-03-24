import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import { backendUrl, STATUS_CODES } from "@/lib/constants";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { formatDate, getLocalISODate } from "@/lib/utils";

type Student = {
  id: number;
  registerNumber: string;
  isIncharge: boolean;
};

interface StudentAttendance {
  student: Student;
}

interface AttendanceRecord {
  classId: number;
  date: string;
  isPresent: boolean;
  id: number;
  Attendance: StudentAttendance[];
}

interface AttendancePercentageProps {
  classId: number;
}

export function AttendancePercentage({ classId }: AttendancePercentageProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [studentList, setStudentList] = useState<Student[]>([]);

  useEffect(() => {
    const attendanceDataCache = JSON.parse(localStorage.getItem(`class/${classId}/attendance`) ?? "[]");
    setAttendanceData(attendanceDataCache);

    const studenetListCache = JSON.parse(localStorage.getItem(`class/${classId}/students`) ?? "[]");
    setStudentList(studenetListCache);

    (async () => {
      const res = await axios.get(`${backendUrl}/class/${classId}/attendance/`, {
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.status === STATUS_CODES.OK) {
        setAttendanceData(res.data.classes);
        localStorage.setItem(`class/${classId}/attendance`, JSON.stringify(res.data.classes));
      }
    })();

    (async () => {
      const res = await axios.get(`${backendUrl}/class/${classId}/student/`, {
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.status === STATUS_CODES.OK) {
        localStorage.setItem(`class/${classId}/students`, JSON.stringify(res.data.classMembers));
        setStudentList(res.data.classMembers);
      }
    })();
  }, []);

  let total: number;
  const studentAttendance = useMemo(() => {
    const studentCounts: Record<number, { registerNumber: string; present: number }> = {};
    total = attendanceData.length;

    attendanceData.forEach((record) => {
      studentList.forEach((student) => {
        if (!studentCounts[student.id]) {
          studentCounts[student.id] = { registerNumber: student.registerNumber, present: 0 };
        }

        const studentAttendanceData = record.Attendance.find((stud) => stud.student.id === student.id);
        if ((record.isPresent && studentAttendanceData) || (!record.isPresent && !studentAttendanceData)) {
          studentCounts[student.id].present += 1;
        }
      });
    });

    return Object.values(studentCounts).map(({ registerNumber, present }) => ({
      registerNumber,
      present,
      percentage: total > 0 ? ((present / total) * 100).toFixed(2) : "0.00",
    }));
  }, [attendanceData, studentList]);

  return (
    <Card className="border bg-black text-white border-white/30 rounded-lg p-4 w-full">
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Attendance Percentage</h2>
        <div className="space-y-3">
          {studentAttendance.map(({ registerNumber, percentage, present }) => (
            <div key={registerNumber} className={`flex justify-between ${parseFloat(percentage) >= 75 ? "text-green-500" : parseFloat(percentage) >= 70 ? "text-amber-500" : "text-red-500"}`}>
              <span>{registerNumber}</span>
              <span>
                {percentage}% ({present}/{total})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AttendanceByDate({ classId }: { classId: number }) {
  const [date, setDate] = useState<string>("");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [attendanceByDate, setAttendanceByDate] = useState<
    {
      id: number;
      attendance: {
        id: number;
        isIncharge: boolean;
        registerNumber: string;
        isPresent: boolean;
      }[];
    }[]
  >([]);

  useEffect(() => {
    const attendanceCache = JSON.parse(localStorage.getItem(`class/${classId}/attendance`) ?? "[]");
    setAttendance(attendanceCache);

    const studenetListCache = JSON.parse(localStorage.getItem(`class/${classId}/students`) ?? "[]");
    setStudentList(studenetListCache);

    (async () => {
      const res = await axios.get(`${backendUrl}/class/${classId}/attendance/`, {
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.status === STATUS_CODES.OK) {
        setAttendance(res.data.classes);
        localStorage.setItem(`class/${classId}/attendance`, JSON.stringify(res.data.classes));
      }
    })();

    (async () => {
      const res = await axios.get(`${backendUrl}/class/${classId}/student/`, {
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.status === STATUS_CODES.OK) {
        localStorage.setItem(`class/${classId}/students`, JSON.stringify(res.data.classMembers));
        setStudentList(res.data.classMembers);
      }
    })();
  }, []);

  return (
    <Card className="border bg-black text-white border-white/30 rounded-lg p-4 w-full">
      <CardContent>
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Attendance</h2>
          <p className="flex gap-2 flex-wrap">{Array.from(new Set(attendance.map((attendanceRecord) => formatDate(new Date(getLocalISODate(new Date(attendanceRecord.date))))))).join(", ")}</p>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-white/30" />
          <Button
            onClick={() => {
              const dateIsoString = new Date(date).toISOString();
              const attendanceOnDate: {
                id: number;
                attendance: {
                  id: number;
                  isIncharge: boolean;
                  registerNumber: string;
                  isPresent: boolean;
                }[];
              }[] = [];
              attendance.forEach((record) => {
                if (record.date !== dateIsoString) {
                  return;
                }

                const attendanceOfRecord: {
                  id: number;
                  isIncharge: boolean;
                  registerNumber: string;
                  isPresent: boolean;
                }[] = [];
                studentList.forEach((student) => {
                  const studentData = record.Attendance.find((stud) => stud.student.id === student.id);
                  if ((record.isPresent && studentData) || (!record.isPresent && !studentData)) {
                    attendanceOfRecord.push({
                      ...student,
                      isPresent: true,
                    });
                  } else {
                    attendanceOfRecord.push({
                      ...student,
                      isPresent: false,
                    });
                  }
                });

                attendanceOnDate.push({
                  id: record.id,
                  attendance: attendanceOfRecord,
                });
              });
              setAttendanceByDate(attendanceOnDate);
            }}
            className="w-full">
            Get Attendance
          </Button>
          <div className="divide-y divide-white/30">
            {attendanceByDate.map((attendanceOnDate) => (
              <div key={attendanceOnDate.id} className="mt-7 pb-5">
                <p className="font-semibold mb-2">Overall Attendance</p>
                <p>Total Present: {attendanceOnDate.attendance.filter((stud) => stud.isPresent).length}</p>
                <p>Total Absent: {attendanceOnDate.attendance.filter((stud) => !stud.isPresent).length}</p>
                <div className="my-5"></div>
                <p className="font-semibold mb-2">Students</p>
                <ul className="space-y-2">
                  {attendanceOnDate.attendance.map((student) => {
                    return (
                      <li key={student.id} className={`flex justify-between ${student.isPresent ? "text-green-500" : "text-red-500"}`}>
                        <span>{student.registerNumber}</span>
                        {student.isPresent ? <span className="text-green-500">P</span> : <span className="text-red-500">A</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
