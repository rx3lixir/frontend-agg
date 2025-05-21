import * as z from "zod";

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Введите подлинную электропочту",
  }),
  name: z.string().min(1, {
    message: "Введите настоящее имя",
  }),
  password: z.string().min(6, {
    message: "Пароль должен содержать более 6 символов",
  }),
  confirmPassword: z.string().min(6, {
    message: "Пароль должен содержать более 6 символов",
  }),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Введите настоящий адрес электропочты",
  }),
  password: z.string().min(6, {
    message: "Пароль должен содержать более 6 символов",
  }),
});
