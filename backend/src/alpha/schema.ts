import { z } from "zod";

const emailDomain = "adithyatech.com";
const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email")
  .includes(emailDomain, {
    message: `Email should be registered to '${emailDomain}'`,
  });
const passwordSchema = z
  .string()
  .trim()
  .min(8, "Password should have at least 8 characters")
  .max(16, "Password must not exceed 16 characters")
  .regex(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/, "Password must contain at least 1 number, uppercase and lowercase letters, and non alpha-numeric characters.");

const facultySignup = z.object({
  username: z.string().trim().min(1, "Username shouldn't be empty"),
  email: emailSchema,
  password: passwordSchema,
});

const facultySignin = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const classCreation = z.object({
  name: z.string().trim().min(1, "Class name should have at least one character"),
  inchargeId: z.number().int("Incharge id should be a integer"),
});

const registerNumber = z.string().trim().min(1, "Register number shouldn't be empty");

const studentSignup = z.array(
  z.object({
    registerNumber,
    isIncharge: z.boolean().optional(),
  })
);

const addStudentToClass = z.object({
  registerNumber: z.array(registerNumber).min(1),
  classId: z.number().int(),
});

const schema = {
  password: passwordSchema,
  class: {
    create: classCreation,
    addStudent: addStudentToClass,
  },
  faculty: {
    signin: facultySignin,
    signup: facultySignup,
  },
  student: {
    signup: studentSignup,
  },
};

export default schema;
