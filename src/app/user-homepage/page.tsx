"use client";

import React, { useRef } from "react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import Outgoing from "@/components/Outgoing";
import Incoming from "@/components/Incoming";
import { logOut } from "@/hooks/useAuth";


interface Message {
  text: string;
  sender: "user" |"gpt"
}

export default function Home() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);


  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!input.trim()) return; // Prevent sending empty input

    const newMessages: Message[] = [...messages, { text: input, sender: "user" }]
    setMessages(newMessages);
    setInput("");  // Clear input after sending
    inputRef.current?.focus();  // Refocus on input

    try {
      const response = await axios.post<{ choices: { message: { role: string; content: string } }[] }>(
        "/api/chat",
        {
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: input }
          ]
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      setMessages([...newMessages, { text: response.data.choices[0].message.content, sender: "gpt" }]);
    } catch (error) {
      console.error("Error with GPT API request:", error);
    }

    
  };

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  }


  

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) return <div>...</div>;

  return (
    <div className="h-[100%] flex flex-col justify-start items-center">
      {/* Chat Header */}
      <div className="flex justify-between w-[100%] bg-white p-4 text-gray-700 border-b border-gray-300">
        <h1 className="text-2xl font-semibold">My Support</h1>
        <button className="bg-black text-white font-bold py-2 px-4  rounded hover:bg-blue-600"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
      

      {/* Chat Messages */}
      <div className="h-screen w-full overflow-y-auto p-4 pb-36">
        {messages.map((message, index) => (
          <div key={ index }>
            { message.sender === "user" ? (
              <Outgoing >{ message.text }</Outgoing>
            ) : (
              <Incoming >{ message.text }</Incoming >
            ) }
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="bg-white border-t border-gray-300 p-4 absolute bottom-0 w-full">
        <div className="flex items-center">
          <input
            ref={inputRef}
            className="text-gray-700 border border-gray-300 rounded py-2 px-4 block w-full focus:outline-2 focus:outline-blue-700"
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            className="bg-indigo-500 text-black px-4 py-2 rounded-md ml-2"
            onClick={handleSubmit}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
