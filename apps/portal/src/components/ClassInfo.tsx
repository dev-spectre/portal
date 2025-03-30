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
