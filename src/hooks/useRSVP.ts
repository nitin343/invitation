import { useState, useCallback } from "react";

interface RSVPData {
  name: string;
  phone: string;
  attending: "yes" | "no";
  meal: "veg" | "nonveg" | "vegan";
  guests: number;
  message: string;
  team?: string;
  lang?: string;
}

const API_URL = "/api";

async function readApiResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export function useRSVP() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRSVP = useCallback(async (data: RSVPData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(
          result?.details ||
          result?.error ||
          "RSVP API is unavailable. Please make sure the backend server is running."
        );
      }

      if (result?.success) {
        return { success: true };
      }

      throw new Error(result?.error || "Failed to submit RSVP");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send RSVP. Please try again.";
      console.error("RSVP Submission Error:", err);
      return { success: false, error: message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submitRSVP, isSubmitting };
}