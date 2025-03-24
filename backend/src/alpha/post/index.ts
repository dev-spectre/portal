import { Hono } from "hono";
import { isFaculty, verifyAuthToken } from "../../middleware/auth.js";
import { STATUS_CODES } from "../../constants.js";
import schema from "../schema.js";
import { PrismaClient } from "@prisma/client";
import { getSignedCookie } from "hono/cookie";
import { env } from "hono/adapter";
import { decode } from "hono/jwt";

const postRouter = new Hono();
const primsa = new PrismaClient();

postRouter.use("*", verifyAuthToken);
postRouter.use("*", isFaculty);

postRouter.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = schema.post.create.safeParse(body);

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
  if (jwtPayload.id !== parsed.data.authorId) {
    c.status(STATUS_CODES.FORBIDDEN);
    return c.json({
      err: "Forbidden, user lacks authorization",
    });
  }

  try {
    const classList = await primsa.class.findMany({
      where: {
        inchargeId: parsed.data.authorId,
        id: {
          in: parsed.data.classId,
        },
      },
      select: {
        id: true,
      },
    });

    const post = await primsa.post.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        authorId: parsed.data.authorId,
      },
    });

    await primsa.postAccess.createMany({
      data: classList.map(({ id }) => {
        return {
          classId: id,
          postId: post.id,
        };
      }),
    });

    c.status(STATUS_CODES.CREATED);
    return c.json({
      access: classList.map(({ id }) => id),
      post,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

postRouter.get("/", async (c) => {
  const limit = parseInt(c.req.query("limit") ?? "") || Number.MAX_SAFE_INTEGER;
  const offset = parseInt(c.req.query("offset") ?? "0");

  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const jwtPayload = decode(cookie.jwt || "").payload;
  const authorId = jwtPayload.id as number;

  try {
    const post = await primsa.post.findMany({
      select: {
        authorId: true,
        createdAt: true,
        updatedAt: true,
        description: true,
        documentSource: true,
        id: true,
        title: true,
        PostAccess: {
          select: {
            class: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        },
      },
      where: {
        authorId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    c.status(STATUS_CODES.OK);
    return c.json({
      post,
    });
  } catch (e) {
    console.error(e);
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

postRouter.put("/", async (c) => {
  const body = await c.req.json();
  const parsed = schema.post.update.safeParse(body);

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
  const authorId = jwtPayload.id as number;
  const data = {
    ...parsed.data,
  };
  delete data["postId" as keyof typeof data];
  delete data["classId" as keyof typeof data];

  try {
    const post = await primsa.post.update({
      data,
      where: {
        id: parsed.data.postId,
      },
    });

    const classList = await primsa.class.findMany({
      where: {
        inchargeId: authorId,
        id: {
          in: parsed.data.classId,
        },
      },
      select: {
        id: true,
      },
    });

    if (parsed.data.classId) {
      await primsa.postAccess.deleteMany({
        where: {
          postId: parsed.data.postId,
        },
      });

      await primsa.postAccess.createMany({
        data: classList.map(({ id }) => {
          return {
            classId: id,
            postId: post.id,
          };
        }),
      });
    }

    c.status(STATUS_CODES.OK);
    return c.json({
      access: classList.map(({ id }) => id),
      post,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

postRouter.delete("/:postId", async (c) => {
  const { postId } = c.req.param();

  const { JWT_KEY } = env<{ JWT_KEY: string }>(c);
  const cookie = await getSignedCookie(c, JWT_KEY);
  const jwtPayload = decode(cookie.jwt || "").payload;
  const authorId = jwtPayload.id as number;

  try {
    const post = await primsa.post.delete({
      where: {
        id: parseInt(postId),
        authorId,
      },
    });

    c.status(STATUS_CODES.OK);
    return c.json({
      deleted: post,
    });
  } catch (e) {
    c.status(STATUS_CODES.SERVICE_UNVAILABLE);
    return c.json({
      err: "Couldn't connect to database",
    });
  }
});

export default postRouter;
