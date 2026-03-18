'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function GuestCheckInContent() {
    const searchParams = useSearchParams()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [bookingRef, setBookingRef] = useState<string>('')
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        idProof: '' as string
    })

    useEffect(() => {
        const phoneParam = searchParams.get('phone')
        if (phoneParam) {
            setFormData(prev => ({ ...prev, phone: phoneParam }))
        }
    }, [searchParams])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Limit file size to 5MB
            if (file.size > 5 * 1024 * 1024) {
                alert('File is too large. Max 5MB allowed.')
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, idProof: reader.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async () => {
        if (!formData.name || !formData.phone || !formData.idProof) {
            alert('Please fill all details and upload ID.')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/guest/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                const data = await res.json()
                setBookingRef(data.bookingRef)
                setStep(3)
            } else {
                alert('Detailed check-in failed. Please try again.')
            }
        } catch (error) {
            console.error(error)
            alert('Something went wrong. Please check your connection.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            {/* Dynamic Header */}
            <div className="w-full max-w-md mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                    <div className={`h-1 w-12 rounded transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                    <div className={`h-1 w-12 rounded transition-colors ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
                </div>
                <span className="text-sm font-semibold text-gray-500">
                    {step === 1 ? 'Personal Info' : step === 2 ? 'ID Upload' : 'Confirmation'}
                </span>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full transition-all duration-300">
                {step === 1 && (
                    <div className="animate-fade-in">
                        <h1 className="text-2xl font-bold mb-2">Welcome to Zenbourg</h1>
                        <p className="text-gray-600 mb-6">Start your online check-in to save time.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    if (formData.name && formData.phone) setStep(2)
                                    else alert('Please fill in valid details')
                                }}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all mt-4 hover:shadow-lg transform active:scale-[0.98]"
                            >
                                Next: Upload ID &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-fade-in">
                        <h1 className="text-2xl font-bold mb-2">Upload ID Proof</h1>
                        <p className="text-gray-600 mb-6">Government requirement for check-in.</p>

                        <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 mb-6 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all group relative overflow-hidden">
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            {formData.idProof ? (
                                <div className="text-green-600 flex flex-col items-center relative z-10">
                                    <div className="w-full h-32 mb-3 rounded-lg overflow-hidden border border-gray-200 bg-white relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={formData.idProof} alt="ID Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">Click to Change</span>
                                        </div>
                                    </div>
                                    <span className="font-semibold flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        File Selected
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">Click to upload Aadhaar / Passport</span>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                </>
                            )}
                        </label>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading || !formData.idProof}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    'Submit Check-in'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-fade-in text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4 animate-[bounce_1s_infinite]">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">You&apos;re all set!</h1>
                        <p className="text-gray-600 mb-6">
                            Check-in details submitted successfully. You can collect your key at the front desk.
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg text-left mb-6 border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Booking Ref</p>
                            <p className="font-mono font-bold text-xl text-gray-900">#{bookingRef}</p>
                        </div>
                        <a href="/guest/dashboard" className="block w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-black transition text-center hover:shadow-lg">
                            Go to Guest Dashboard
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function GuestCheckInPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading check-in...</div>}>
            <GuestCheckInContent />
        </Suspense>
    )
}
