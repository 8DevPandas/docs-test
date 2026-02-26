"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i]!;
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Ingresá el código completo de 6 dígitos");
      return;
    }
    setIsVerifying(true);
    try {
      const result = await authClient.emailOtp.verifyEmail({
        email,
        otp: code,
      });
      if (result.error) {
        toast.error(result.error.message || "Código inválido");
      } else {
        toast.success("Email verificado correctamente");
        router.push("/chat");
      }
    } catch {
      toast.error("Error al verificar el código");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
      toast.success("Código reenviado");
    } catch {
      toast.error("Error al reenviar el código");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="mx-auto w-full mt-10 max-w-md p-6">
      <h1 className="mb-2 text-center text-3xl font-bold">Verificar Email</h1>
      <p className="text-center text-muted-foreground mb-8">
        Ingresá el código de 6 dígitos enviado a{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Código de verificación</Label>
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-12 text-center text-lg font-bold"
                autoFocus={index === 0}
              />
            ))}
          </div>
        </div>

        <Button
          onClick={handleVerify}
          className="w-full"
          disabled={isVerifying || otp.join("").length !== 6}
        >
          {isVerifying ? "Verificando..." : "Verificar"}
        </Button>

        <div className="text-center">
          <Button
            variant="link"
            onClick={handleResend}
            disabled={isResending}
            className="text-primary"
          >
            {isResending ? "Reenviando..." : "Reenviar código"}
          </Button>
        </div>
      </div>
    </div>
  );
}
