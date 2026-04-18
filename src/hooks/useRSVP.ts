import { useState, useCallback } from "react";

interface RSVPData {
  name: string;
  phone: string;
  attending: "yes" | "no";
  meal: "veg" | "nonveg";
  guests: number;
  message: string;
}

const API_URL = "http://localhost:5000/api";

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

      const result = await response.json();
      
      if (result.success) {
        return { success: true };
      } else {
        throw new Error(result.error || "Failed to submit RSVP");
      }
    } catch (err) {
      console.error("RSVP Submission Error:", err);
      return { success: false, error: "Failed to send RSVP. Please try again." };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submitRSVP, isSubmitting };
}
