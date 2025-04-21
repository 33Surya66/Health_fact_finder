import emailjs from "@emailjs/browser";

const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Initialize EmailJS with your public key
emailjs.init(publicKey);

/**
 * Sends an email using EmailJS
 * @param {Object} formData - The form data containing email details
 * @returns {Promise<Object>} - Returns a promise that resolves to a response object
 */
export const sendEmail = async (formData) => {
  // Log environment variables (without exposing full key)
  console.log("EmailJS Configuration:", {
    serviceId: serviceId ? "Present" : "Missing",
    templateId: templateId ? "Present" : "Missing",
    publicKey: publicKey ? "Present" : "Missing",
    actualServiceId: serviceId,
    actualTemplateId: templateId,
    actualPublicKey: publicKey,
  });

  try {
    if (!serviceId || !templateId || !publicKey) {
      throw new Error("Missing required EmailJS configuration");
    }

    // Log the form data being sent (excluding sensitive info)
    console.log("Sending email with data:", {
      ...formData,
      message: formData.message
        ? `${formData.message.substring(0, 20)}...`
        : undefined,
    });

    const response = await emailjs.send(
      serviceId,
      templateId,
      formData,
      publicKey
    );

    console.log("Email sent successfully:", response.status, response.text);
    return {
      success: true,
      message: "Email sent successfully!",
      data: response,
    };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      message: error.message || "Failed to send email. Please try again later.",
      error: {
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      },
    };
  }
};
