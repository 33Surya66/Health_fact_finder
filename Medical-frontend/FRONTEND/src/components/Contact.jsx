import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { sendEmail } from "../config/emailConfig";

const Contact = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState({
    submitted: false,
    submitting: false,
    info: { error: false, msg: null },
  });

  const [inputs, setInputs] = useState({
    name: "",
    email: user?.email || "",
    subject: "",
    message: "",
  });

  const handleServerResponse = (ok, msg) => {
    if (ok) {
      setStatus({
        submitted: true,
        submitting: false,
        info: { error: false, msg },
      });
      setInputs({
        name: "",
        email: user?.email || "",
        subject: "",
        message: "",
      });
    } else {
      setStatus({
        submitted: false,
        submitting: false,
        info: { error: true, msg },
      });
    }
  };

  const handleOnChange = (e) => {
    e.persist();
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setStatus({
      submitted: false,
      submitting: false,
      info: { error: false, msg: null },
    });
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    setStatus((prevStatus) => ({ ...prevStatus, submitting: true }));

    try {
      const templateParams = {
        from_name: inputs.name,
        to_name: "Admin",
        from_email: inputs.email,
        subject: inputs.subject,
        message: inputs.message,
      };

      const { success, error } = await sendEmail(templateParams);

      if (success) {
        handleServerResponse(
          true,
          "Thank you for reaching out! We will get back to you soon."
        );
      } else {
        throw new Error(error || "Failed to send message");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      handleServerResponse(false, "Failed to send message. Please try again.");
    }
  };

  return (
    <div className="py-16 bg-gray-50" id="contact">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">
            Contact Us
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Have questions? We'd love to hear from you. Send us a message and
            we'll respond as soon as possible.
          </p>

          {status.info.error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              Error: {status.info.msg}
            </div>
          )}

          {status.submitted ? (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {status.info.msg}
            </div>
          ) : (
            <form onSubmit={handleOnSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={inputs.name}
                  onChange={handleOnChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={inputs.email}
                  onChange={handleOnChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700"
                >
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  name="subject"
                  value={inputs.subject}
                  onChange={handleOnChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={inputs.message}
                  onChange={handleOnChange}
                  required
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={status.submitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {status.submitting ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
