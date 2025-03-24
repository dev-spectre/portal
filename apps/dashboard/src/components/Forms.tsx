import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { z } from "zod";
import axios from "axios";
import { STATUS_CODES, backendUrl } from "@/lib/constants";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";

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

const schema = {
  signup: z.object({
    username: z.string().trim().min(1, "Username shouldn't be empty"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  }),
  signin: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
  class: {
    create: z.object({
      name: z.string().min(1, "Class name is required"),
      students: z.string().min(1, "Register number is required"),
    }),
  },
};

export function SignupForm() {
  const form = useForm<z.infer<typeof schema.signup>>({
    resolver: zodResolver(schema.signup),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      confirmPassword: "",
    },
  });

  return (
    <div className="min-h-[100dvh] flex flex-col gap-2 justify-center items-center">
      <div className="border min-w-72 max-w-96 w-full rounded-lg border-white/30 py-7 px-10">
        <Form {...form}>
          <form
            method="POST"
            onSubmit={form.handleSubmit(async (values) => {
              if (values.confirmPassword !== values.password) {
                form.setError("password", {
                  message: "Passwords doesn't match",
                });
                form.setError("confirmPassword", {
                  message: "Passwords doesn't match",
                });
              }

              const res = await axios.post(
                `${backendUrl}/faculty/auth/signup/`,
                {
                  username: values.username,
                  email: values.email,
                  password: values.password,
                },
                {
                  validateStatus: () => true,
                }
              );

              if (res.status == STATUS_CODES.CREATED) {
                localStorage.setItem("userId", res.data.id);
                localStorage.setItem("username", res.data.username);
                alert("User created");
              } else if (res.status === STATUS_CODES.CONFLICT) {
                form.setError("email", {
                  message: "User with this email already exists",
                });
              }
            })}>
            <h1 className="text-center font-blod text-xl">Signup</h1>
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="Password" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input placeholder="Password" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-center mt-5">
              <Button>Submit</Button>
            </div>
          </form>
        </Form>
      </div>
      <p>
        Already have an account?{" "}
        <a href="/signin/" className="underline">
          signin
        </a>
      </p>
    </div>
  );
}

export function SigninForm() {
  const form = useForm<z.infer<typeof schema.signin>>({
    resolver: zodResolver(schema.signin),
    defaultValues: {
      password: "",
      email: "",
    },
  });

  return (
    <div className="min-h-[100dvh] flex flex-col gap-2 justify-center items-center">
      <div className="border min-w-72 max-w-96 w-full rounded-lg border-white/30 py-7 px-10">
        <Form {...form}>
          <form
            method="POST"
            onSubmit={form.handleSubmit(async (values) => {
              const res = await axios.post(
                `${backendUrl}/faculty/auth/signin/`,
                {
                  email: values.email,
                  password: values.password,
                },
                {
                  withCredentials: true,
                  validateStatus: () => true,
                }
              );

              if (res.status === STATUS_CODES.OK) {
                localStorage.setItem("userId", res.data.id);
                localStorage.setItem("username", res.data.username);
                window.location.href = "/";
              } else if (res.status === STATUS_CODES.NOT_FOUND) {
                form.setError("email", {
                  message: "User with this email doesn't exist",
                });
              } else if (res.status === STATUS_CODES.UNAUTHORIZED) {
                form.setError("password", {
                  message: "Incorrect password",
                });
              }
            })}>
            <h1 className="text-center font-blod text-xl">Signin</h1>
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="Password" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-center mt-5">
              <Button>Submit</Button>
            </div>
          </form>
        </Form>
      </div>
      <p>
        Don't have an account?{" "}
        <a href="/signup/" className="underline">
          signup
        </a>
      </p>
    </div>
  );
}

export default function CreateClassForm() {
  type FormData = z.infer<typeof schema.class.create>;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema.class.create),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setSuccess(null);
    try {
      const studentList = data.students.split(",").map((reg) => reg.trim());

      const studentResponse = await axios.post(
        `${backendUrl}/faculty/student/`,
        { students: studentList.map((reg) => ({ registerNumber: reg })) },
        {
          withCredentials: true,
          validateStatus: () => true,
        }
      );

      if (studentResponse.status == STATUS_CODES.SERVICE_UNVAILABLE) {
        setError("Couldn't create students, try again later");
      }

      const inchargeId = parseInt(localStorage.getItem("userId") ?? "");
      if (Number.isNaN(inchargeId)) {
        localStorage.clear();

        window.location.href = "/sigin";
      }
      const classResponse = await axios.post(
        `${backendUrl}/class/create/`,
        { name: data.name, inchargeId },
        {
          withCredentials: true,
          validateStatus: () => true,
        }
      );

      if (classResponse.status !== STATUS_CODES.CREATED) {
        throw new Error("Failed to create class");
      } else {
        const classListCache = JSON.parse(localStorage.getItem("classList") ?? "[]");
        classListCache.push({
          id: classResponse.data.id,
          name: classResponse.data.name,
        });
        localStorage.setItem("classList", JSON.stringify(classListCache));
      }

      const classId = classResponse.data.id;

      const addStudentsResponse = await axios.post(
        `${backendUrl}/class/add/`,
        { classId, registerNumber: studentList },
        {
          withCredentials: true,
          validateStatus: () => true,
        }
      );

      if (addStudentsResponse.status === STATUS_CODES.CREATED) {
        setSuccess("Class created and students added successfully!");
      } else if (addStudentsResponse.status === STATUS_CODES.FORBIDDEN) {
        setError("Invalid input format");
      } else if (addStudentsResponse.status === STATUS_CODES.SERVICE_UNVAILABLE) {
        setError("Service unavailable. Try again later.");
      } else {
        setError("Something went wrong.");
      }
    } catch (err) {
      setError("Failed to process request.");
    }
  };

  return (
    <div className="container mx-auto px-5 flex justify-center items-center mt-10">
      <Card className="border bg-black border-white/30 rounded-lg p-4 w-full max-w-md">
        <CardContent className="py-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input {...register("name")} placeholder="Class Name" className="border border-white/30 text-white" />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            <div>
              <Input {...register("students")} placeholder="Student Register Numbers (comma separated)" className="border text-whiteI border-white/30 text-white" />
              {errors.students && <p className="text-red-500 text-sm">{errors.students.message}</p>}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}
            <Button type="submit" className="w-full">
              Create Class
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
