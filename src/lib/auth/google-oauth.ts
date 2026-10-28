import { google } from "googleapis";

const redirectURI = `${process.env.BASE_URL}/auth/google/callback`;

export const googleOAuth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  redirectURI,
);
