import React from 'react'
import ScoreGauge from "~/components/ScoreGauge";
import ScoreBadge from "~/components/ScoreBadge";
const Category = ({title, score}: {title: string, score: number}) => {
const textcolor = score >70? 'text-green-600'
    : score >49? 'text-yellow-600' : 'text-red-600'
    return (
        <div className="resume-summary">
            <div className = "category">
                <div className ="flex flex-row gap-2 items-center justify-center">
                    <p className ="text-2xl">{title}</p>
                    <ScoreBadge score={score} />
                </div>
                <p className = "text-2xl">
                    <span className ={textcolor}>{score}</span>/100
                </p>
            </div>
        </div>
    )
}
const Summary = ({ feedback }: { feedback: Feedback }) => {
    const overall = feedback?.overallScore ?? 0;
    const tone = feedback?.toneAndStyle?.score ?? 0;
    const content = feedback?.content?.score ?? 0;
    const structure = feedback?.structure?.score ?? 0;
    const skills = feedback?.skills?.score ?? 0;

    return (
        <div className="bg-white rounded-2xl shadow-md w-full ">
            <div className="flex flex-col items-center p-4 gap-8">
                <ScoreGauge score={overall} />
                <div className="flex flex-col gap-2"></div>
                <h2 className="text-2xl font-bold"> Your Resume Score</h2>
                <p className="text-sm text-gray-500">
                    This score is calculated based on the variables listed below.
                </p>
            </div>

            <Category title="tone & style" score={tone} />
            <Category title="content" score={content} />
            <Category title="structure" score={structure} />
            <Category title="skills" score={skills} />
        </div>
    );
}
export default Summary;