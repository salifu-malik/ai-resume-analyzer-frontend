import {Link, useNavigate, useParams} from "react-router";
import {useEffect, useRef, useState} from "react";
import { useAuthStore } from "~/lib/backend";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import { buildAnalysisPdf } from "~/lib/pdf";
import { captureElementToPdf } from "~/lib/pdf-wysiwyg";

export const meta = () => ([
    { title: 'Resucheck | Review ' },
    { name: 'description', content: 'Detailed overview of your resume' },
])

const Resume = () => {
    const { fetchMe } = useAuthStore();
    const { id } = useParams();
    const [imageUrl, setImageUrl] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [exporting, setExporting] = useState(false);
    const navigate = useNavigate();
    const captureRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        (async () => {
            try {
                await fetchMe();
            } catch {}
            if (!useAuthStore.getState().isAuthenticated) {
                navigate(`/auth?next=/resume/${id}`);
            }
        })();
    }, [id, fetchMe, navigate])

    useEffect(() => {
        const loadResume = async () => {
            const resume = typeof window !== 'undefined' ? sessionStorage.getItem(`resume:${id}`) : null;
            if (!resume) return;
            try {
                const data = JSON.parse(resume);
                if (data.resumeUrl) setResumeUrl(data.resumeUrl);
                if (data.imageUrl) setImageUrl(data.imageUrl);
                if (data.feedback) setFeedback(data.feedback);
            } catch {}
        };
        loadResume();
    }, [id]);

    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>
            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={imageUrl}
                                    className="w-full h-full object-contain rounded-2xl"
                                    title="resume"
                                />
                            </a>
                        </div>
                    )}
                </section>
                <section ref={captureRef} className="feedback-section">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
                      {feedback && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              if (!captureRef.current) return;
                              setExporting(true);
                              // Build filename from context if available
                              let baseName = "resume-review";
                              let sessionObj: any = null;
                              try {
                                const raw = typeof window !== 'undefined' ? sessionStorage.getItem(`resume:${id}`) : null;
                                if (raw) {
                                  sessionObj = JSON.parse(raw);
                                  const jobTitle = (sessionObj.jobTitle || sessionObj.companyName || '').toString().trim();
                                  if (jobTitle) baseName = `resume-review_${jobTitle.replace(/\s+/g, '-')}`;
                                }
                              } catch {}
                              const filename = `${baseName}_${new Date().toISOString().slice(0,10)}.pdf`;
                              try {
                                // 1) Try styled export first
                                await captureElementToPdf(captureRef.current, {
                                  filename,
                                  pageFormat: 'a4',
                                  orientation: 'portrait',
                                  background: '#ffffff',
                                });
                              } catch (e) {
                                // eslint-disable-next-line no-console
                                console.error('Styled PDF export failed:', e);
                                // 2) Graceful fallback to compact/text PDF using the already rendered feedback
                                try {
                                  if (sessionObj && feedback) {
                                    await buildAnalysisPdf({
                                      companyName: String(sessionObj.companyName || ''),
                                      jobTitle: String(sessionObj.jobTitle || ''),
                                      jobDescription: String(sessionObj.jobDescription || ''),
                                      feedback,
                                      imageUrl: String(sessionObj.imageUrl || ''),
                                      resumeUrl: String(sessionObj.resumeUrl || ''),
                                    });
                                  } else if (feedback) {
                                    await buildAnalysisPdf({ feedback });
                                  } else {
                                    throw new Error('No feedback available for fallback export');
                                  }
                                } catch (fallbackErr) {
                                  console.error('Fallback PDF export failed:', fallbackErr);
                                  alert('Failed to generate styled PDF. Please try again.');
                                }
                              } finally {
                                setExporting(false);
                              }
                            }}
                            className={`primary-button ${exporting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={exporting}
                            title="Download PDF (Styled)"
                          >
                            {exporting ? 'Preparing…' : 'Download PDF'}
                          </button>
                        </div>
                      )}
                    </div>
                    {feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback} />
                            <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                            <Details feedback={feedback} />
                        </div>
                    ) : (
                        <img src="/images/resume-scan-2.gif" className="w-full" />
                    )}
                </section>
            </div>
        </main>
    )
}
export default Resume