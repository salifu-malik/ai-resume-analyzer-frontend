import { useEffect, useState } from "react";
import { backend, type BackendUser } from "~/lib/backend";

export default function SendEmail() {
    const [users, setUsers] = useState<BackendUser[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<string>("all");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch all users from database
    useEffect(() => {
        backend.adminGetUsers().then((res) => {
            if (res.ok) {
                setUsers(res.users);
            }
        });
    }, []);

    const sendEmail = async () => {
        if (!subject || !message) {
            alert("Subject and message are required");
            return;
        }

        setLoading(true);

        try {
            if (selectedEmail === "all") {
                // Send to all users
                for (const user of users) {
                    await backend.adminSendEmail({
                        to: user.email,
                        subject,
                        message,
                    });
                }
            } else {
                // Send to single user
                await backend.adminSendEmail({
                    to: selectedEmail,
                    subject,
                    message,
                });
            }

            alert("Email sent successfully");
            setSubject("");
            setMessage("");
        } catch (err) {
            alert("Failed to send email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Send Email to Users
            </h2>

            {/* Email selector */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient
            </label>
            <select
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
                className="w-full border rounded-md p-2 mb-4"
            >
                <option value="all">All Users</option>
                {users.map((user) => (
                    <option key={user.id} value={user.email}>
                        {user.email} ({user.name})
                    </option>
                ))}
            </select>

            {/* Subject */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
            </label>
            <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="w-full border rounded-md p-2 mb-4"
            />

            {/* Message */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
            </label>
            <textarea
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                className="w-full border rounded-md p-2 mb-6"
            />

            {/* Send Button */}
            <button
                onClick={sendEmail}
                disabled={loading}
                className="bg-cyan-600 text-white px-6 py-2 rounded-md hover:bg-cyan-700 disabled:opacity-50"
            >
                {loading ? "Sending..." : "Send Email"}
            </button>
        </div>
    );
}
