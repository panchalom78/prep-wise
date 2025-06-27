"use client";

import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

enum CallStatus {
    INACTIVE = "INACTIVE",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
    FINISHED = "FINISHED",
}

interface SavedMessage {
    role: "user" | "system" | "assistant";
    content: string;
}

const Agent = ({
    userName,
    userId,
    type,
    interviewId,
    questions,
}: AgentProps) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [callStatus, setCallStatus] = useState<CallStatus>(
        CallStatus.INACTIVE
    );
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
        setLoading(true);
        console.log("Genearte Feedback here");
        const { success, feedbackId: id } = await createFeedback({
            interviewId: interviewId!,
            userId: userId!,
            transcript: messages,
        });

        setLoading(false);
        if (success && id) {
            toast.success("Feedback generated Successfully");
            router.push(`/interview/${interviewId}/feedback`);
        } else {
            console.log("Error saving feedback");
            toast.error("Failed to save Feedback.Please try again later.");
            router.push("/");
        }
    };

    useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
        const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

        const onMessage = (message: Message) => {
            if (
                message.type === "transcript" &&
                message.transcriptType === "final"
            ) {
                const newMessage = {
                    role: message.role,
                    content: message.transcript,
                };

                setMessages((prev) => [...prev, newMessage]);
            }
        };

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);

        const onError = (error: Error) => console.log("Error", error);

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("speech-start", onSpeechStart);
        vapi.on("speech-end", onSpeechEnd);
        vapi.on("error", onError);

        return () => {
            vapi.off("call-start", onCallStart);
            vapi.off("call-end", onCallEnd);
            vapi.off("message", onMessage);
            vapi.off("speech-start", onSpeechStart);
            vapi.off("speech-end", onSpeechEnd);
            vapi.off("error", onError);
        };
    }, []);

    useEffect(() => {
        if (callStatus === CallStatus.FINISHED) {
            if (type === "generate") {
                router.push("/");
            } else {
                handleGenerateFeedback(messages);
            }
        }
    }, [messages, callStatus, type, userId]);

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);
        if (type === "generate") {
            console.log(userName, userId);
            await vapi.start(
                undefined,
                undefined,
                undefined,
                process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!,
                {
                    variableValues: {
                        username: userName,
                        userid: userId,
                    },
                }
            );
        } else {
            let formattedQuestions = "";
            if (questions) {
                formattedQuestions = questions
                    .map((question) => `- ${question}`)
                    .join("\n");
            }

            await vapi.start(interviewer, {
                variableValues: {
                    questions: formattedQuestions,
                },
            });
        }
    };

    const handleDisconnect = () => {
        setCallStatus(CallStatus.FINISHED);

        vapi.stop();
    };

    const lastestMessage = messages[messages.length - 1]?.content;

    const isCallInactiveOrFininshed =
        callStatus === CallStatus.INACTIVE ||
        callStatus === CallStatus.FINISHED;

    return (
        <>
            <div className="call-view relative">
                {loading && (
                    <div className="absolute w-full flex items-center justify-center h-full gap-2 bg-black/50">
                        Genearting Feedback
                        <div className="flex space-x-2 justify-center items-center bg-white h-screen dark:invert">
                            <span className="sr-only">Loading...</span>
                            <div className="h-3 w-3 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="h-3 w-3 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="h-3 w-3 bg-black rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                <div className="card-interviewer">
                    <div className="avatar">
                        <Image
                            src="/ai-avatar.png"
                            alt="vapi"
                            width={65}
                            height={54}
                            className="object-cover"
                        />
                        {isSpeaking && <span className="animate-speak" />}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>

                <div className="card-border">
                    <div className="card-content">
                        <Image
                            src="/user-avatar.png"
                            alt="user-avatar"
                            width={540}
                            height={540}
                            className="rounded-full object-cover size-[120px]"
                        />
                        <h3>{userName}</h3>
                    </div>
                </div>
            </div>
            {messages.length > 0 && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p
                            key={lastestMessage}
                            className={cn(
                                "transition-opacity duration-500 opacity-0",
                                "animate-fadeIn opacity-100"
                            )}
                        >
                            {lastestMessage}
                        </p>
                    </div>
                </div>
            )}

            <div className="w-full flex justify-center">
                {callStatus !== CallStatus.ACTIVE ? (
                    <button onClick={handleCall}>
                        <span
                            className={cn(
                                "absolute animate-ping rounded-full opacity-75",
                                callStatus !== CallStatus.CONNECTING && "hidden"
                            )}
                        />
                        <span className="relative btn-call">
                            {isCallInactiveOrFininshed ? "Call" : ". . . "}
                        </span>
                    </button>
                ) : (
                    <button
                        className="btn-disconnect"
                        onClick={handleDisconnect}
                    >
                        End
                    </button>
                )}
            </div>
        </>
    );
};

export default Agent;
