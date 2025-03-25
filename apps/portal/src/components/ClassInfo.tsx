import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl, STATUS_CODES } from "@/lib/constants";
import { Card, CardContent } from "./ui/card";
import { formatDate } from "@/lib/utils";

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
    student: Student;
  }[];
};

interface Post {
  id: number;
  title: string;
  description: string | null;
  documentSource: string | null;
  createdAt: string;
  updatedAt: string;
}

export function ClassInfo({ classId }: { classId: number }) {
  const [attendance, setAttendance] = useState<
    {
      id: number;
      AttendanceMode: AttendanceMode[];
    }[]
  >([]);
  const [post, setPost] = useState<
    {
      id: number;
      PostAccess: {
        Post: Post;
      }[];
    }[]
  >([]);

  const [classObject, setClassObject] = useState<{
    id: number;
    name: string;
  }>();

  useEffect(() => {
    const classList: { id: number; name: string }[] = JSON.parse(localStorage.getItem("classList") ?? "[]");
    const classObject = classList.find((classObject) => classObject.id === classId);
    if (classObject) setClassObject(classObject);

    (async function fetchAttendance() {
      const res = await axios.get(`${backendUrl}/student/attendance/`, {
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.status === STATUS_CODES.OK) {
        localStorage.setItem(`class/${classId}/attendance`, JSON.stringify(res.data.class));
        setAttendance(res.data.class);
      }
    })();
  }, []);

  useEffect(() => {
    (async function fetchPost() {
      const res = await axios.get(`${backendUrl}/student/post/`, {
        withCredentials: true,
        validateStatus: () => true,
      });

      if (res.status === STATUS_CODES.OK) {
        localStorage.setItem(`class/${classId}/post`, JSON.stringify(res.data.class));
        setPost(res.data.class);
      }
    })();
  }, []);

  const attendanceRecord = attendance.find((value) => value.id === classId)?.AttendanceMode || ([] as AttendanceMode[]);
  const hoursAttended = useMemo(() => {
    let presentCount = 0;
    attendanceRecord?.forEach((record) => {
      if ((record.isPresent && record.Attendance.length) || (!record.isPresent && !record.Attendance.length)) {
        presentCount += 1;
      }
    });
    return presentCount;
  }, [attendance]);
  const attendancePercentage = attendanceRecord.length > 0 ? (hoursAttended / attendanceRecord.length) * 100 : 100;

  const posts = post.find((cls) => cls.id === classId)?.PostAccess.map((value) => value.Post) || ([] as Post[]);

  return (
    <div className="space-y-10">
      <h2 className="mb-3 text-lg font-bold">Class Information</h2>
      <div className="border border-white/30 rounded-lg px-5 py-7">
        <h1 className="text-lg font-bold mb-3">{classObject?.name}</h1>
        <p>
          <span>Hours taken:</span> <span>{attendanceRecord.length}</span>
        </p>
        <p>
          <span>Hours Attended:</span> <span>{hoursAttended}</span>
        </p>
        <p>
          {attendanceRecord && (
            <>
              <span>Attendance percentage:</span>{" "}
              <span className={`${attendancePercentage >= 75 ? "text-green-500" : attendancePercentage >= 70 ? "text-amber-500" : "text-red-500"}`}>{`${attendancePercentage.toFixed(2)}%`}</span>
            </>
          )}
        </p>
      </div>
      {/* <TakeAttendance {...{ classId, studentList, setAttendance, attendance }} /> */}
      <div>
        <h2 className="mb-3 text-lg font-bold">Posts</h2>
        {posts.map((post) => (
          <Card key={post.id} className="border bg-black text-white border-white/30 rounded-lg p-4">
            <CardContent>
              <div className="flex flex-wrap justify-between mb-3">
                <h3 className="text-xl font-bold">{post.title}</h3>
                <p className="text-sm text-gray-400">
                  Uploaded: {formatDate(new Date(post.createdAt))} {post.createdAt !== post.updatedAt && "(Edited)"}
                </p>
              </div>
              {post.description && <p className="text-gray-300 mb-2">{post.description}</p>}
              {post.documentSource && (
                <a href={post.documentSource} target="_blank" rel="noopener noreferrer" className="text-blue-400">
                  View Document
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// type AttendancProps = {
//   classId: number;
//   studentList: Student[];
//   setAttendance: React.Dispatch<React.SetStateAction<AttendanceMode[]>>;
//   attendance: AttendanceMode[];
// };

// export default function TakeAttendance({ classId, studentList, setAttendance, attendance }: AttendancProps) {
//   const [attendanceRecord, setAttendanceRecord] = useState<{ [key: number]: boolean }>({});
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);
//   const [date, setDate] = useState<string>(getLocalISODate(new Date()));

//   const handleAttendanceChange = (studentId: number) => {
//     setAttendanceRecord((prev) => (console.log({ ...prev, [studentId]: !prev[studentId] }), { ...prev, [studentId]: !prev[studentId] }));
//   };

//   const submitAttendance = async () => {
//     setError(null);
//     setSuccess(null);

//     const presentStudents = Object.keys(attendanceRecord)
//       .filter((id) => attendanceRecord[Number(id)])
//       .map(Number);
//     const absentStudents = studentList.map((s: Student) => s.id).filter((id) => !presentStudents.includes(id));

//     const isPresent = presentStudents.length < absentStudents.length;
//     const selectedStudents = isPresent ? presentStudents : absentStudents;
//     try {
//       const attendancePayload = { classId, date: new Date(date).toISOString(), isPresent, studentId: selectedStudents };
//       const response = await axios.post(`${backendUrl}/class/attendance/`, attendancePayload, { withCredentials: true, validateStatus: () => true });

//       if (response.status === STATUS_CODES.CREATED) {
//         setSuccess("Attendance recorded successfully!");
//         setAttendance([
//           ...attendance,
//           {
//             id: response.data.attendanceModeId,
//             classId: attendancePayload.classId,
//             date: attendancePayload.date,
//             isPresent: attendancePayload.isPresent,
//             Attendance: attendancePayload.studentId.map((studentId) => {
//               return {
//                 student: studentList.find((student) => student.id === studentId) || {
//                   id: studentId,
//                   isIncharge: false,
//                   registerNumber: "UNKNOWN",
//                 },
//               };
//             }),
//           },
//         ]);
//       } else if (response.status === STATUS_CODES.SERVICE_UNVAILABLE) {
//         setError("Service unavailable. Try again later.");
//       } else {
//         setError("Something went wrong.");
//       }
//     } catch (err) {
//       setError("Failed to connect to server.");
//     }
//   };

//   return (
//     <Card className="border bg-black text-white border-white/30 rounded-lg p-4 w-full">
//       <CardContent>
//         <h2 className="text-xl font-semibold mb-4">Take Attendance</h2>
//         <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-white/30 w-full mb-4" />
//         <div className="space-y-2">
//           {studentList.map((student: Student) => (
//             <div key={student.id} className="flex items-center gap-2">
//               <Checkbox id={student.id.toString()} checked={attendanceRecord[student.id] || false} onCheckedChange={() => handleAttendanceChange(student.id)} />
//               <label htmlFor={student.id.toString()}>{student.registerNumber}</label>
//             </div>
//           ))}
//         </div>
//         {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
//         {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
//         <Button onClick={submitAttendance} className="w-full mt-4">
//           Submit Attendance
//         </Button>
//       </CardContent>
//     </Card>
//   );
// }
