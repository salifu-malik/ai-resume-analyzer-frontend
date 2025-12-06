import {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import { useAuthStore } from "~/lib/backend";

const Upload = () => {
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);


    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const normalizeFeedback = (input: any): Feedback => {
        const coerceTips = (
  arr: any
): { type: 'good' | 'improve'; tip: string; explanation: string }[] =>
  Array.isArray(arr)
    ? arr.map((t: any) => ({
        type: t?.type === 'good' ? 'good' : 'improve',
        tip: String(t?.tip ?? ''),
        explanation: String(t?.explanation ?? ''),
      }))
    : [];

        return {
            overallScore: Number(input?.overallScore ?? 0),
            ATS: {
                score: Number(input?.ATS?.score ?? 0),
                tips: ((Array.isArray(input?.ATS?.tips) ? input.ATS.tips : []).map((t: any) => ({
                    type: t?.type === 'good' ? 'good' : 'improve',
                    tip: String(t?.tip ?? ''),
                })) as Feedback["ATS"]["tips"]),
            },
            toneAndStyle: {
                score: Number(input?.toneAndStyle?.score ?? 0),
                tips: coerceTips(input?.toneAndStyle?.tips),
            },
            content: {
                score: Number(input?.content?.score ?? 0),
                tips: coerceTips(input?.content?.tips),
            },
            structure: {
                score: Number(input?.structure?.score ?? 0),
                tips: coerceTips(input?.structure?.tips),
            },
            skills: {
                score: Number(input?.skills?.score ?? 0),
                tips: coerceTips(input?.skills?.tips),
            },
        };
    };

    const handleAnalyze = async ({
                                     companyName,
                                     jobTitle,
                                     jobDescription,
                                     file,
                                 }: {
        companyName: string;
        jobTitle: string;
        jobDescription: string;
        file: File;
    }) => {
        try {
            setIsProcessing(true);

            setStatusText('Checking wallet...');
            // Ensure backend session and wallet are up to date
            const { fetchMe } = useAuthStore.getState();
            await fetchMe().catch(() => {});
            const authed = useAuthStore.getState().isAuthenticated;
            if (!authed) {
                setStatusText('You must be signed in. Redirecting to auth...');
                navigate('/auth?next=/upload');
                return;
            }
            const currentCoins = useAuthStore.getState().user?.coins ?? 0;
            if (currentCoins < 1) {
                setStatusText('Insufficient coins. Please buy a coin on the homepage.');
                return;
            }

            setStatusText('Converting to image...');
            const imageFile = await convertPdfToImage(file);
            if (!imageFile.file) {
                setStatusText('Error: Failed to convert PDF to image');
                return;
            }

            // Create in-memory URLs for preview (valid for this tab session)
            const resumeUrl = URL.createObjectURL(file);
            const imageUrl = URL.createObjectURL(imageFile.file);

            setStatusText('Preparing data...');
            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumeUrl,
                imageUrl,
                companyName,
                jobTitle,
                jobDescription,
                feedback: '',
            } as any;
            // Persist transiently in sessionStorage for the resume page
            try { sessionStorage.setItem(`resume:${uuid}`, JSON.stringify(data)); } catch {}

            setStatusText('Examining...');

            // Convert image blob to base64 data URL for backend (Gemini) analysis
            const toBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(blob); // data:image/png;base64,...
            });

            const imageBase64 = await toBase64(imageFile.file);

            // Post to backend analyze-resume.php (backend will also debit 1 coin on success)
            const base = (import.meta.env.VITE_BACKEND_URL as string).replace(/\/$/, '');
            const resp = await fetch(`${base}/analyze-resume.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ companyName, jobTitle, jobDescription, imageBase64 })
            });
            const result = await resp.json().catch(() => ({}));
            if (!resp.ok || !result?.ok || !result?.feedback) {
                const msg = result?.error || `Failed to examine resume (${resp.status})`;
                setStatusText(msg);
                setIsProcessing(false);
                return;
            }

            // Backend already returns feedback in expected format. Normalize defensively.
            (data as any).feedback = normalizeFeedback(result.feedback);
            try { sessionStorage.setItem(`resume:${uuid}`, JSON.stringify(data)); } catch {}

            // Refresh backend user to update coin balance in UI (server already debited)
            try { await useAuthStore.getState().fetchMe(); } catch {}

            setStatusText('Examination complete, redirecting...');
            console.log(data);
            navigate(`/resume/${uuid}`);
        } catch (err: any) {
            console.error('handleAnalyze error:', err);
            setStatusText(
                err?.error?.message || err?.message || 'Error: Failed to examine resume'
            );
            setIsProcessing(false);
        }
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) return;

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full" />
                        </>
                    ) : (
                        <h2>Drop your resume for an ATS score and improvement tips</h2>
                    )}
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
                            </div>

                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>

                            <button className="primary-button" type="submit">
                                Examine Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload