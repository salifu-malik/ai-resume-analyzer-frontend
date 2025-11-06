import React, {useState} from 'react'

export const meta = () => ([
    {title: 'Resucheck | Auth'},
    {name: 'description', content: 'Log into your account'},
])

const Auth = () => {

    return (
        <main className = "bg-[url(images/bg-main.svg)] bg-cover main-screen flex item-center justify-center">
            <div className="gradient-border shadow-lg">
                <section className="flex flex-col gab-8 bg-white rounded-2xl p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1>Welcome</h1>
                        <h2>Log In To Continue Your Job Search Path</h2>
                    </div>
                </section>
            </div>

        </main>
    )
}

export default Auth