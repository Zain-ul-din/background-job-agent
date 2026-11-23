import { describe, expect, it } from "vitest";
import { extractEmails, extractUrls } from "../src/lib/utils/parsers";

describe("extractEmails", () => {
  it("finds recruiter emails in a job post", () => {
    const post =
      "We're hiring! Send your CV to jobs@techcorp.io or hr.team+eng@mail.example.co.uk";
    expect(extractEmails(post)).toEqual([
      "jobs@techcorp.io",
      "hr.team+eng@mail.example.co.uk",
    ]);
  });

  it("de-duplicates repeated addresses", () => {
    expect(extractEmails("a@x.com, a@x.com and again a@x.com")).toEqual([
      "a@x.com",
    ]);
  });

  it("returns an empty array when there are no emails", () => {
    expect(extractEmails("Apply on our careers page")).toEqual([]);
  });
});

describe("extractUrls", () => {
  it("strips trailing punctuation and de-duplicates", () => {
    const text =
      "Apply at https://jobs.example.com/123. More: (https://example.com/about) https://jobs.example.com/123!";
    expect(extractUrls(text)).toEqual([
      "https://jobs.example.com/123",
      "https://example.com/about",
    ]);
  });
});
