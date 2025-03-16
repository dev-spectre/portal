import { Hono } from "hono";
import auth from "./auth.js";

const facultyRouter = new Hono();

facultyRouter.route("auth/", auth);

export default facultyRouter;