import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { z } from "zod";
import axios from "axios";
import { STATUS_CODES, backendUrl } from "@/lib/constants";
import { useState } from "react";

const passwordSchema = z.string().trim().min(8, "Password should have at least 8 characters").max(16, "Password must not exceed 16 characters");

const schema = {
  signin: z.object({
    registerNumber: z.string().trim().min(1, "Register number is required"),
    password: passwordSchema,
    newPassword: passwordSchema
      .regex(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/, "Password must contain at least 1 number, uppercase and lowercase letters, and non alpha-numeric characters.")
      .optional(),
    confirmNewPassword: passwordSchema
      .regex(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/, "Password must contain at least 1 number, uppercase and lowercase letters, and non alpha-numeric characters.")
      .optional(),
  }),
};

export function SigninForm() {
  const [changePassword, setChangePassword] = useState(false);
  const form = useForm<z.infer<typeof schema.signin>>({
    resolver: zodResolver(schema.signin),
    defaultValues: {
      password: "",
      registerNumber: "",
    },
  });

  return (
    <div className="min-h-[100dvh] flex flex-col gap-2 justify-center items-center">
      <div className="border min-w-72 max-w-96 w-full rounded-lg border-white/30 py-7 px-10">
        <Form {...form}>
          <form
            method="POST"
            onSubmit={form.handleSubmit(async (values) => {
              if (changePassword) {
                if (values.newPassword !== values.confirmNewPassword) {
                  form.setError("newPassword", {
                    message: "Password doesn't match",
                  });
                  form.setError("confirmNewPassword", {
                    message: "Password doesn't match",
                  });

                  return;
                }

                const changePasswordRes = await axios.put(
                  `${backendUrl}/student/auth/password/`,
                  {
                    registerNumber: values.registerNumber,
                    currentPassword: values.password,
                    newPassword: values.newPassword,
                  },
                  {
                    withCredentials: true,
                    validateStatus: () => true,
                  }
                );

                if (changePasswordRes.status === STATUS_CODES.UNAUTHORIZED) {
                  form.setError("password", {
                    message: "Incorrect password",
                  });
                } else if (changePasswordRes.status === STATUS_CODES.NOT_FOUND) {
                  form.setError("registerNumber", {
                    message: "User doesn't exist",
                  });
                } else if (changePasswordRes.status === STATUS_CODES.OK) {
                  localStorage.setItem("userId", changePasswordRes.data.id);
                  localStorage.setItem("username", changePasswordRes.data.username);
                  localStorage.setItem("isIncharge", changePasswordRes.data.isIncharge);
                  window.location.href = "/";
                }

                return;
              }

              const res = await axios.post(
                `${backendUrl}/student/auth/signin/`,
                {
                  ...values,
                },
                {
                  withCredentials: true,
                  validateStatus: () => true,
                }
              );

              if (res.status === STATUS_CODES.OK) {
                localStorage.setItem("userId", res.data.id);
                localStorage.setItem("username", res.data.username);
                localStorage.setItem("isIncharge", res.data.isIncharge);
                window.location.href = "/";
              } else if (res.status === STATUS_CODES.NOT_FOUND) {
                form.setError("registerNumber", {
                  message: "User doesn't exist",
                });
              } else if (res.status === STATUS_CODES.UNAUTHORIZED || res.status == STATUS_CODES.BAD_REQUEST) {
                form.setError("password", {
                  message: "Incorrect password",
                });
              } else if (res.status === STATUS_CODES.FORBIDDEN) {
                setChangePassword(true);
              }
            })}>
            <h1 className="text-center font-blod text-xl">Signin</h1>
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="registerNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Register Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Register Number" type="text" {...field} />
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
              {changePassword && (
                <>
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input placeholder="New password" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input placeholder="Confirm new password" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
            <div className="flex justify-center mt-5">
              <Button>Signin</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
