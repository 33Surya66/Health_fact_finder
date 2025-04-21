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
  console.log("Attempting to send email...", {
    serviceId,
    templateId,
    // Log non-sensitive form data
    formFields: Object.keys(formData),
  });

  try {
    if (!serviceId || !templateId || !publicKey) {
      throw new Error("Missing required EmailJS configuration");
    }

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
      message: "Failed to send email. Please try again later.",
      error: {
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      },
    };
  }
};
