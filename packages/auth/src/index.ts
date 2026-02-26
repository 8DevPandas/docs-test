import { db } from "@tandem-docs/db";
import * as schema from "@tandem-docs/db/schema/auth";
import { env } from "@tandem-docs/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";

const resend = new Resend(env.RESEND_API_KEY);
const platformName = "Tandem Docs";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: env.BASE_DOMAIN
    ? [`https://${env.BASE_DOMAIN}`, `https://*.${env.BASE_DOMAIN}`]
    : [env.BETTER_AUTH_URL],
  advanced: {
    ...(env.COOKIE_DOMAIN
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: env.COOKIE_DOMAIN,
          },
        }
      : {}),
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  plugins: [
    nextCookies(),
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp }) {
        const response = await resend.emails.send({
          from: `${platformName} <noreply@eventurex.com.ar>`,
          to: email,
          subject: `Tu código de verificación: ${otp}`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #282f66; font-size: 24px; margin: 0;">${platformName}</h1>
              </div>
              <p style="color: #333; font-size: 16px;">Tu código de verificación es:</p>
              <div style="background: #f4f4f8; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #282f66;">${otp}</span>
              </div>
              <p style="color: #666; font-size: 14px;">Este código expira en 10 minutos.</p>
              <p style="color: #999; font-size: 12px; margin-top: 32px;">Si no solicitaste este código, podés ignorar este email.</p>
            </div>
          `,
        });
        console.log(response);
      },
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!user.email.endsWith("@eventurex.com.ar")) {
            return false;
          }
        },
      },
    },
  },
});

