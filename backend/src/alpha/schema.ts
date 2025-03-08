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

const schema = {
  facultySignup,
  facultySignin,
};

export default schema;
