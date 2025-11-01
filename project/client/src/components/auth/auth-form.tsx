import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import { GraduationCap, Presentation } from "lucide-react";

const AuthForm = () => {
  const [selectedRole, setSelectedRole] = useState<"student" | "proctor">("student");
  const [authType, setAuthType] = useState<"login" | "register">("login");

  const handleRoleChange = (role: "student" | "proctor") => {
    setSelectedRole(role);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-md w-full">
      <div className={`py-6 px-8 ${selectedRole === "student" ? "bg-primary" : "bg-secondary"}`}>
        <h1 className="font-heading text-2xl font-bold text-white text-center">ProctorDiary</h1>
        <p className="text-blue-100 text-center mt-1">Academic Mentoring Management System</p>
      </div>

      <div className="p-8">
        <div className="mb-6">
          <h2 className="font-heading text-xl font-medium text-gray-500 mb-1">
            {authType === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-gray-400 text-sm">
            {authType === "login"
              ? "Please select your role and sign in to continue"
              : "Please select your role and fill in your details"}
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="flex mb-6 border rounded-md overflow-hidden">
          <button
            onClick={() => handleRoleChange("student")}
            className={`flex-1 py-3 px-4 font-medium focus:outline-none transition-colors duration-200 flex items-center justify-center ${
              selectedRole === "student"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            <GraduationCap className="mr-2 h-4 w-4" /> Student
          </button>
          <button
            onClick={() => handleRoleChange("proctor")}
            className={`flex-1 py-3 px-4 font-medium focus:outline-none transition-colors duration-200 flex items-center justify-center ${
              selectedRole === "proctor"
                ? "bg-secondary text-white"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            <Presentation className="mr-2 h-4 w-4" /> Proctor
          </button>
        </div>

        <Tabs defaultValue="login" value={authType} onValueChange={(v) => setAuthType(v as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm role={selectedRole} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm role={selectedRole} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthForm;
