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

const registerNumber = z.string().trim().min(1, "Register number shouldn't be empty");

const schema = {
  password: passwordSchema,
  class: {
    create: z.object({
      name: z.string().trim().min(1, "Class name should have at least one character"),
      inchargeId: z.number().int("Incharge id should be a integer"),
    }),
    delete: z.object({
      classId: z.number().int(),
    }),
    addStudent: z.object({
      registerNumber: z.array(registerNumber).min(1),
      classId: z.number().int(),
    }),
    attendance: {
      add: z.object({
        classId: z.number().int(),
        date: z.string().datetime(),
        isPresent: z.boolean(),
        studentId: z.array(z.number().int()),
      }),
    },
  },
  faculty: {
    signin: z.object({
      email: emailSchema,
      password: passwordSchema,
    }),
    signup: z.object({
      username: z.string().trim().min(1, "Username shouldn't be empty"),
      email: emailSchema,
      password: passwordSchema,
    }),
  },
  student: {
    signup: z.array(
      z.object({
        registerNumber,
        isIncharge: z.boolean().optional(),
      })
    ),
    password: z.object({
      registerNumber,
      currentPassword: z.string().trim().min(8),
      newPassword: passwordSchema,
    }),
    signin: z.object({
      registerNumber,
      password: passwordSchema,
    }),
  },
  post: {
    create: z.object({
      title: z.string().trim().min(1, "Title should contain at least one character"),
      description: z.string().trim().optional().nullable(),
      documentSource: z.string().trim().url("Document source must be a URL").optional().nullable(),
      authorId: z.number().int(),
      classId: z.array(z.number().int()),
    }),
    update: z.object({
      postId: z.number().int(),
      title: z.string().trim().min(1, "Title should contain at least one character").optional(),
      description: z.string().trim().optional().nullable(),
      documentSource: z.string().trim().url("Document source must be a URL").optional().nullable(),
      classId: z.array(z.number().int()).optional(),
    }),
  },
};

export default schema;
