import {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions, AIResponseFormat} from "~/constants";

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const userId = auth.user?.uuid;

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
            if (!userId) {
                setStatusText('You must be signed in. Redirecting to auth...');
                navigate('/auth?next=/upload');
                return;
            }
            const rawCoins = await kv.get(`coins:${userId}`);
            const currentCoins = rawCoins ? Number(rawCoins) : 0;
            if (!Number.isFinite(currentCoins) || currentCoins < 1) {
                setStatusText('Insufficient coins. Please buy a coin on the homepage. Redirecting...');
                setTimeout(() => navigate('/'), 1200);
                return;
            }

            setStatusText('Uploading the file...');
            const uploadedFile = await fs.upload([file]);
            if (!uploadedFile) {
                setStatusText('Error: Failed to upload file');
                return;
            }

            setStatusText('Converting to image...');
            const imageFile = await convertPdfToImage(file);
            if (!imageFile.file) {
                setStatusText('Error: Failed to convert PDF to image');
                return;
            }

            setStatusText('Uploading the image...');
            const uploadedImage = await fs.upload([imageFile.file]);
            if (!uploadedImage) {
                setStatusText('Error: Failed to upload image');
                return;
            }

            setStatusText('Preparing data...');
            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName,
                jobTitle,
                jobDescription,
                feedback: '',
            };
            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            setStatusText('Examining...');

            const feedback = await ai.feedback(
                uploadedFile.path,
                prepareInstructions({ AIResponseFormat, jobTitle, jobDescription })
            );

            if (!feedback) {
                setStatusText('Error: Failed to examine resume');
                return;
            }

            const feedbackText =
                typeof feedback.message.content === 'string'
                    ? feedback.message.content
                    : feedback.message.content[0].text;

            (data as any).feedback = normalizeFeedback(JSON.parse(feedbackText));
            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            // Debit 1 coin for this completed review
            try {
                if (userId) {
                    const rawCoins2 = await kv.get(`coins:${userId}`);
                    const coins2 = rawCoins2 ? Number(rawCoins2) : 0;
                    const nextCoins = Math.max(0, (Number.isFinite(coins2) ? coins2 : 0) - 1);
                    await kv.set(`coins:${userId}`, String(nextCoins));
                }
            } catch (e) {
                console.warn('Failed to debit coin:', e);
            }

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