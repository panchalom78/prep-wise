"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import FormFeild from "./FormFeild";
import { useRouter } from "next/navigation";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/firebase/client";
import { signIn, signUp } from "@/lib/actions/auth.action";

const authFormSchema = (type: FormType) => {
    return z.object({
        name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
        email: z.string().email(),
        password: z.string().min(3),
    });
};

const AuthForm = ({ type }: { type: FormType }) => {
    const formSchema = authFormSchema(type);

    const router = useRouter();
    const isSignIn = type === "sign-in";

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            if (type === "sign-in") {
                const { email, password } = values;

                const userCredentials = await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                const idToken = await userCredentials.user.getIdToken();
                if (!idToken) {
                    toast.error("Sign in falied");
                    return;
                }

                await signIn({ email, idToken });

                toast.success("Sign in successful.");
                router.push("/");
            } else {
                const { name, email, password } = values;

                const userCredentials = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                const result = await signUp({
                    uid: userCredentials.user.uid,
                    name: name!,
                    email,
                    password,
                });

                if (!result?.success) {
                    toast.error(result?.message);
                    return;
                }

                toast.success("Account created successfully. Please sign in.");
                router.push("/sign-in");
            }
        } catch (e) {
            toast.error(`There was an error: ${e}`);
        }
    }

    return (
        <div className="card-border lg:min-w-[566px]">
            <div className="flex flex-col card gap-6 py-14 px-10">
                <div className="flex flex-row gap-2 justify-center">
                    <Image src="/logo.svg" alt="logo" width={38} height={32} />
                    <h2 className="text-primary-100">PrepWise</h2>
                </div>
                <h3>Practice job interview with AI</h3>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="w-full space-y-6 mt-4 form"
                    >
                        {!isSignIn && (
                            <FormFeild
                                {...form}
                                name="name"
                                label="Name"
                                placeholder="Your name"
                            />
                        )}
                        <FormFeild
                            {...form}
                            name="email"
                            label="Email"
                            placeholder="Your email"
                            type="email"
                        />
                        <FormFeild
                            {...form}
                            name="password"
                            label="Password"
                            placeholder="Enter your password"
                            type="password"
                        />

                        <Button type="submit" className="btn">
                            {isSignIn ? "Sign in" : "Create An Account"}
                        </Button>
                    </form>
                </Form>
                <p className="text-center">
                    {isSignIn
                        ? "No account yet ?"
                        : "Already have an account ?"}
                    <Link
                        href={isSignIn ? "/sign-up" : "/sign-in"}
                        className="font-bold text-user-primary ml-1"
                    >
                        {isSignIn ? "Sign up" : "Sign in"}
                    </Link>
                </p>
            </div>
        </div>
    );
};
export default AuthForm;
