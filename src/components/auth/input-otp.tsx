"use client";
import React, { useEffect, useRef, useState } from "react";

interface OtpInputProps {
  length?: number;
  onChangeOtp: (otp: string) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({ length = 6, onChangeOtp }) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto focus first input when mounted
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (value: string, index: number) => {
    if (/[^0-9]/.test(value)) return; // allow only digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // ensure only 1 digit

    setOtp(newOtp);
    onChangeOtp(newOtp.join(""));

    // move to next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Move left
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Move right
    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ✅ Handle paste event (fixes "only first digit" issue)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, ""); // remove non-digits
    if (!pastedData) return;

    const newOtp = pastedData.slice(0, length).split("");
    for (let i = 0; i < length; i++) {
      newOtp[i] = newOtp[i] || "";
    }

    setOtp(newOtp);
    onChangeOtp(newOtp.join(""));

    // focus last filled input
    const nextIndex = Math.min(pastedData.length - 1, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-2 sm:gap-4">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-10 h-10 sm:w-12 sm:h-12 text-center text-xl border rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      ))}
    </div>
  );
};

export default OtpInput;
