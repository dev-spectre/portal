import { Hono } from "hono";
import { STATUS_CODES } from "../../constants.js";
import schema from "../schema.js";
import { getSignedCookie } from "hono/cookie";
import { env } from "hono/adapter";
import { decode } from "hono/jwt";
import { PrismaClient } from "@prisma/client";
import { verifyAuthToken } from "../../middleware/auth.js";

const classRouter = new Hono();
const prisma = new PrismaClient();

classRouter.use("*", verifyAuthToken);

classRouter.get("/", async (c) => {
  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const jwtPayload = decode(cookie.jwt || "").payload;
  const facultyId = jwtPayload.id as number;

  if (jwtPayload.role !== "Faculty") {
    c.status(STATUS_CODES.FORBIDDEN);
    return c.json({
      err: "Forbidden, user lacks authorization",
    });
  }

  try {
    const data = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
      },
      where: {
        inchargeId: facultyId,
      },
    });

    c.status(STATUS_CODES.OK);
    return c.json({
      data,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

classRouter.delete("/:classId{[0-9]+}", async (c) => {
  const { classId } = c.req.param();

  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const jwtPayload = decode(cookie.jwt || "").payload;
  if (jwtPayload.role !== "Faculty") {
    c.status(STATUS_CODES.FORBIDDEN);
    return c.json({
      err: "Forbidden, user lacks authorization",
    });
  }

  try {
    const classObject = await prisma.class.delete({
      where: {
        id: parseInt(classId),
        inchargeId: jwtPayload.id as number,
      },
    });

    c.status(STATUS_CODES.OK);
    return c.json({
      ...classObject,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

classRouter.post("create/", async (c) => {
  const body = await c.req.json();
  const parsed = schema.class.create.safeParse(body);

  if (!parsed.success) {
    c.status(STATUS_CODES.BAD_REQUEST);
    return c.json({
      err: "Invalid format",
      zodErr: parsed.error,
    });
  }

  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const jwtPayload = decode(cookie.jwt || "").payload;
  if (jwtPayload.role !== "Faculty" || jwtPayload.id !== parsed.data.inchargeId) {
    c.status(STATUS_CODES.FORBIDDEN);
    return c.json({
      err: "Forbidden, user lacks authorization",
    });
  }

  try {
    const classObject = await prisma.class.create({
      data: {
        name: parsed.data.name,
        inchargeId: parsed.data.inchargeId,
      },
    });

    c.status(STATUS_CODES.CREATED);
    return c.json({
      ...classObject,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

classRouter.post("add/", async (c) => {
  const body = await c.req.json();
  const parsed = schema.class.addStudent.safeParse(body);

  if (!parsed.success) {
    c.status(STATUS_CODES.BAD_REQUEST);
    return c.json({
      err: "Invalid format",
      zodErr: parsed.error,
    });
  }

  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const jwtPayload = decode(cookie.jwt || "").payload;
  if (jwtPayload.role != "Faculty") {
    c.status(STATUS_CODES.FORBIDDEN);
    return c.json({
      err: "Forbidden, user lacks authorization",
    });
  }

  const students = parsed.data.registerNumber.map((registerNumber) => {
    return {
      classId: parsed.data.classId,
      registerNumber,
    };
  });

  try {
    const classObject = await prisma.class.findUnique({
      select: {
        inchargeId: true,
      },
      where: {
        id: parsed.data.classId,
      },
    });

    if (jwtPayload.id !== classObject?.inchargeId) {
      c.status(STATUS_CODES.FORBIDDEN);
      return c.json({
        err: "Forbidden, user lacks authorization",
      });
    }

    const data = await prisma.classMember.createManyAndReturn({
      data: students,
      skipDuplicates: true,
      select: {
        registerNumber: true,
      },
    });
    c.status(STATUS_CODES.CREATED);
    return c.json({
      classId: parsed.data.classId,
      students: data,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

classRouter.get(":classId{[0-9]+}/student/", async (c) => {
  const { classId } = c.req.param();

  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const jwtPayload = decode(cookie.jwt || "").payload;
  if (jwtPayload.role !== "Faculty" && jwtPayload.role !== "Incharge") {
    c.status(STATUS_CODES.FORBIDDEN);
    return c.json({
      err: "Forbidden, user lacks authorization",
    });
  }

  try {
    const data = await prisma.class.findUnique({
      where: {
        id: parseInt(classId),
        OR: [
          {
            inchargeId: jwtPayload.id as number,
          },
          {
            ClassMember: {
              some: {
                student: {
                  id: jwtPayload.id as number,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        inchargeId: true,
        ClassMember: {
          select: {
            student: {
              select: {
                id: true,
                registerNumber: true,
                isIncharge: true,
              },
            },
          },
        },
      },
    });
    c.status(STATUS_CODES.OK);

    if (!data) {
      c.status(STATUS_CODES.NOT_FOUND);
      return c.json({
        err: "Class doesn't exist",
      });
    }

    return c.json({
      classId: data.id,
      inchargeId: data.inchargeId,
      classMembers: data.ClassMember.map((member) => member.student),
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

classRouter.post("attendance/", async (c) => {
  const body = await c.req.json();
  const parsed = schema.class.attendance.add.safeParse(body);

  if (!parsed.success) {
    c.status(STATUS_CODES.BAD_REQUEST);
    return c.json({
      err: "Invalid format",
      zodErr: parsed.error,
    });
  }

  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const jwtPayload = decode(cookie.jwt || "").payload;
  if (jwtPayload.role != "Faculty" && jwtPayload.role != "Incharge") {
    c.status(STATUS_CODES.FORBIDDEN);
    return c.json({
      err: "Forbidden, user lacks authorization",
    });
  }

  try {
    const classObject = await prisma.class.findUnique({
      where: {
        id: parsed.data.classId,
      },
      select: {
        id: true,
        inchargeId: true,
        ClassMember: {
          select: {
            student: {
              select: {
                id: true,
                registerNumber: true,
                isIncharge: true,
              },
            },
          },
        },
      },
    });

    if (!classObject) {
      c.status(STATUS_CODES.NOT_FOUND);
      return c.json({
        err: "Class doesn't exist",
      });
    }

    if (jwtPayload.role === "Faculty" && jwtPayload.id !== classObject.inchargeId) {
      c.status(STATUS_CODES.FORBIDDEN);
      return c.json({
        err: "Forbidden, user lacks authorization",
      });
    } else if (jwtPayload.role === "Incharge") {
      let isIncharge = false;
      for (let i = 0; i < classObject.ClassMember.length; i++) {
        if (classObject.ClassMember[i].student.id === jwtPayload.id && classObject.ClassMember[i].student.isIncharge) {
          isIncharge = true;
          break;
        }
      }

      if (!isIncharge) {
        c.status(STATUS_CODES.FORBIDDEN);
        return c.json({
          err: "Forbidden, user lacks authorization",
        });
      }
    }

    //* remove time from ISO date string
    const date = new Date(parsed.data.date.split("T")[0]);
    const attendanceMode = await prisma.attendanceMode.create({
      data: {
        isPresent: parsed.data.isPresent,
        classId: parsed.data.classId,
        date: date.toISOString(),
      },
      select: {
        id: true,
      },
    });

    const students = parsed.data.studentId.filter((studentId) => {
      const student = classObject.ClassMember.find((students) => students.student.id === studentId);
      return !!student;
    });

    const attendance = await prisma.attendance.createMany({
      data: students.map((studentId) => {
        return {
          studentId,
          attendanceModeId: attendanceMode.id,
        };
      }),
    });

    c.status(STATUS_CODES.CREATED);
    return c.json({
      attendanceModeId: attendanceMode.id,
      mode: parsed.data.isPresent ? "Present" : "Absent",
      count: attendance.count,
    });
  } catch (e) {
    console.error(e);
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

classRouter.get(":classId{[0-9]+}/attendance/", async (c) => {
  const { classId } = c.req.param();
  const fromDate = c.req.query("from") ?? "2000-01-01";
  const date = new Date(fromDate);

  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const jwtPayload = decode(cookie.jwt || "").payload;
  if (jwtPayload.role != "Faculty" && jwtPayload.role != "Incharge") {
    c.status(STATUS_CODES.FORBIDDEN);
    return c.json({
      err: "Forbidden, user lacks authorization",
    });
  }

  try {
    const classObject = await prisma.class.findUnique({
      where: {
        id: parseInt(classId),
      },
      select: {
        id: true,
        inchargeId: true,
        ClassMember: {
          select: {
            student: {
              select: {
                id: true,
                registerNumber: true,
                isIncharge: true,
              },
            },
          },
        },
      },
    });

    if (!classObject) {
      c.status(STATUS_CODES.NOT_FOUND);
      return c.json({
        err: "Class doesn't exist",
      });
    }

    if (jwtPayload.role === "Faculty" && jwtPayload.id !== classObject.inchargeId) {
      c.status(STATUS_CODES.FORBIDDEN);
      return c.json({
        err: "Forbidden, user lacks authorization",
      });
    } else if (jwtPayload.role === "Incharge") {
      let isIncharge = false;
      for (let i = 0; i < classObject.ClassMember.length; i++) {
        if (classObject.ClassMember[i].student.id === jwtPayload.id && classObject.ClassMember[i].student.isIncharge) {
          isIncharge = true;
          break;
        }
      }

      if (!isIncharge) {
        c.status(STATUS_CODES.FORBIDDEN);
        return c.json({
          err: "Forbidden, user lacks authorization",
        });
      }
    }

    const attendance = await prisma.attendanceMode.findMany({
      where: {
        classId: parseInt(classId),
        date: {
          gte: date,
        },
      },
      select: {
        classId: true,
        date: true,
        isPresent: true,
        id: true,
        Attendance: {
          select: {
            student: {
              select: {
                id: true,
                isIncharge: true,
                registerNumber: true,
              },
            },
          },
        },
      },
    });

    c.status(STATUS_CODES.OK);
    return c.json({
      classes: attendance,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

export default classRouter;
